<?php
declare(strict_types=1);

/** Cigario collection contract v2: authenticated, initial-only, non-destructive import. */
ini_set('display_errors','0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function v2Reply(int $code,array $result): never {http_response_code($code);echo json_encode($result,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);exit;}
function v2Config():array{
 $root=$_SERVER['DOCUMENT_ROOT']??'';
 $path=getenv('CIGARIO_CONFIG_FILE')?:dirname($root!==''?$root:__DIR__).'/cigario-config.php';
 if(!is_file($path))return [];
 $value=require $path;return is_array($value)?$value:[];
}
$cfg=v2Config();
$origin=$_SERVER['HTTP_ORIGIN']??'';
if($origin!==''){
 if(!in_array($origin,$cfg['allowed_origins']??[],true))v2Reply(403,['error'=>'Origin not allowed']);
 header('Access-Control-Allow-Origin: '.$origin);
 header('Access-Control-Allow-Credentials: true');header('Vary: Origin');
 header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token, X-Cigario-Client');
 header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
}
if(($_SERVER['REQUEST_METHOD']??'GET')==='OPTIONS')v2Reply(204,[]);
$secure=!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off';
if(!$secure && !(($cfg['allow_insecure_local']??false)&&in_array($_SERVER['REMOTE_ADDR']??'',['127.0.0.1','::1'],true)))v2Reply(403,['error'=>'HTTPS required']);
session_name('cigario_session');
session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Lax']);
if(session_status()!==PHP_SESSION_ACTIVE)session_start();
$_SESSION['csrf']??=bin2hex(random_bytes(24));
function v2Db(array $cfg):PDO{
 foreach(['db_host','db_name','db_user','db_password'] as $key)if(!isset($cfg[$key])||!is_string($cfg[$key]))v2Reply(503,['error'=>'Database not configured']);
 return new PDO('mysql:host='.$cfg['db_host'].';dbname='.$cfg['db_name'].';charset=utf8mb4',$cfg['db_user'],$cfg['db_password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
}
function v2Bearer():?string{
 $header=$_SERVER['HTTP_AUTHORIZATION']??$_SERVER['REDIRECT_HTTP_AUTHORIZATION']??'';
 return preg_match('/^Bearer ([a-f0-9]{64})$/i',$header,$m)?$m[1]:null;
}
function v2Owner(PDO $pdo):string{
 if(($token=v2Bearer())!==null){$q=$pdo->prepare('SELECT user_id FROM api_tokens WHERE token_hash=? AND expires_at > UTC_TIMESTAMP() LIMIT 1');$q->execute([hash('sha256',$token)]);$user=$q->fetchColumn();if($user)return (string)$user;v2Reply(401,['error'=>'Invalid or expired token']);}
 if(!empty($_SESSION['user_id'])&&is_string($_SESSION['user_id']))return $_SESSION['user_id'];
 v2Reply(401,['error'=>'Sign in required']);
}
function v2Csrf():void{
 if(v2Bearer()===null&&!hash_equals((string)($_SESSION['csrf']??''),(string)($_SERVER['HTTP_X_CSRF_TOKEN']??'')))v2Reply(403,['error'=>'CSRF token invalid']);
}
function v2Id(mixed $id):bool{return is_string($id)&&preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i',$id)===1;}
function v2Text(mixed $v,int $max,bool $required=false):bool{return is_string($v)&&mb_strlen($v)<=$max&&(!$required||trim($v)!=='');}
function v2Iso(mixed $v):bool{return is_string($v)&&preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/',$v)===1&&DateTimeImmutable::createFromFormat('!Y-m-d\TH:i:s\Z',$v)?->format('Y-m-d\TH:i:s\Z')===$v;}
function v2Date(mixed $v):bool{return is_string($v)&&preg_match('/^\d{4}-\d{2}-\d{2}$/',$v)===1&&DateTimeImmutable::createFromFormat('!Y-m-d',$v)?->format('Y-m-d')===$v;}
function v2Body():array{
 if((int)($_SERVER['CONTENT_LENGTH']??0)>2097152)v2Reply(413,['error'=>'Initial import exceeds 2 MiB']);
 $raw=file_get_contents('php://input',false,null,0,2097153);
 if(!is_string($raw)||strlen($raw)>2097152)v2Reply(413,['error'=>'Initial import exceeds 2 MiB']);
 try{$data=json_decode($raw,true,30,JSON_THROW_ON_ERROR);}catch(JsonException){v2Reply(400,['error'=>'Invalid JSON']);}
 if(!is_array($data))v2Reply(400,['error'=>'Expected JSON object']);return $data;
}
function v2Published(PDO $pdo,array $cigarIds):void{
 $ids=array_values(array_unique($cigarIds));
 if(count($ids)>500)v2Reply(422,['error'=>'Too many distinct catalog references']);
 if(!$ids)return;
 $query=$pdo->prepare("SELECT id FROM cigar_catalog c WHERE c.id=? AND c.published=1 AND EXISTS (SELECT 1 FROM catalog_field_sources f WHERE f.cigar_id=c.id AND f.verification_state='verified')");
 foreach($ids as $id){if(!v2Text($id,64,true))v2Reply(422,['error'=>'Invalid catalog reference']);$query->execute([$id]);if(!$query->fetchColumn())v2Reply(422,['error'=>'Catalog item not published and verified: '.$id]);}
}
function v2Validate(PDO $pdo,array $body):array{
 if(($body['contract']??null)!=='cigario.collection.v2'||($body['operation']??null)!=='initial-import'||($body['source']??null)!=='offline-v0.4')v2Reply(422,['error'=>'Unsupported contract or source']);
 if(!v2Id($body['deviceId']??null)||!v2Id($body['clientMutationId']??null)||($body['expectedServerRevision']??null)!==0)v2Reply(422,['error'=>'Invalid device, mutation, or expected revision']);
 $snap=$body['snapshot']??null;
 if(!is_array($snap))v2Reply(422,['error'=>'Missing snapshot']);
 $caps=['humidors'=>100,'lots'=>500,'events'=>5000,'reviews'=>2000];
 foreach($caps as $name=>$max)if(!isset($snap[$name])||!is_array($snap[$name])||count($snap[$name])>$max)v2Reply(422,['error'=>'Invalid or oversized '.$name]);
 if(count($snap['humidors'])===0)v2Reply(422,['error'=>'At least one humidor is required']);
 $hum=[];$lots=[];$events=[];$reviews=[];$catalog=[];
 foreach($snap['humidors'] as $h){if(!is_array($h)||!v2Id($h['id']??null)||isset($hum[$h['id']])||!v2Text($h['name']??null,50,true)||!v2Text($h['notes']??'',120))v2Reply(422,['error'=>'Invalid humidor']);$hum[$h['id']]=true;}
 foreach($snap['lots'] as $l){if(!is_array($l)||!v2Id($l['id']??null)||isset($lots[$l['id']])||!isset($hum[$l['humidorId']??''])||!v2Text($l['cigarId']??null,64,true)||!v2Date($l['acquiredAt']??null)||!is_int($l['quantityAcquired']??null)||$l['quantityAcquired']<1||$l['quantityAcquired']>100000||!v2Text($l['location']??null,160)||!v2Text($l['source']??null,190)||!v2Text($l['memo']??null,2000)||!in_array($l['format']??null,['Single','Pack','Box'],true))v2Reply(422,['error'=>'Invalid lot']);
  if(($l['pricePaidCents']??null)!==null&&(!is_int($l['pricePaidCents'])||$l['pricePaidCents']<0))v2Reply(422,['error'=>'Invalid price']);
  if(($l['allocatedCostCents']??null)!==null&&(!is_int($l['allocatedCostCents'])||$l['allocatedCostCents']<0))v2Reply(422,['error'=>'Invalid allocated cost']);
  if(($l['originLotId']??null)!==null&&!v2Id($l['originLotId']))v2Reply(422,['error'=>'Invalid origin lot']);
  $lots[$l['id']]=$l;$catalog[]=$l['cigarId'];}
 foreach($lots as $l)if($l['originLotId']!==null&&!isset($lots[$l['originLotId']]))v2Reply(422,['error'=>'Missing origin lot']);
 $balances=array_fill_keys(array_keys($lots),0);$beginnings=array_fill_keys(array_keys($lots),0);$transactions=[];$sequences=[];
 foreach($snap['events'] as $ev){if(!is_array($ev)||!v2Id($ev['id']??null)||isset($events[$ev['id']])||!isset($lots[$ev['lotId']??''])||!v2Iso($ev['occurredAt']??null)||!is_int($ev['sequence']??null)||$ev['sequence']<0||isset($sequences[$ev['sequence']])||!is_int($ev['delta']??null)||abs($ev['delta'])>100000||!v2Text($ev['note']??null,350))v2Reply(422,['error'=>'Invalid stock event']);
  $kind=$ev['kind']??null;if(!in_array($kind,['acquisition','consumed','adjustment','transfer_in','transfer_out','transferred','metadata_updated'],true))v2Reply(422,['error'=>'Unsupported event kind']);
  if(in_array($kind,['transferred','metadata_updated'],true)&&$ev['delta']!==0)v2Reply(422,['error'=>'Metadata event must have zero delta']);
  if($kind==='consumed'&&$ev['delta']!==-1)v2Reply(422,['error'=>'Consumption must be minus one']);
  if($kind==='transfer_in'&&$ev['delta']<=0||$kind==='transfer_out'&&$ev['delta']>=0||$kind==='acquisition'&&$ev['delta']<=0)v2Reply(422,['error'=>'Invalid inventory movement']);
  if(($ev['transactionId']??null)!==null){if(!v2Id($ev['transactionId']))v2Reply(422,['error'=>'Invalid transaction']);$transactions[$ev['transactionId']][]=$ev;}
  $events[$ev['id']]=$ev;$sequences[$ev['sequence']]=true;
 }
 // Local event-array order is authoritative for replay. The date alone is not used for sorting.
 usort($snap['events'],fn($a,$b)=>$a['sequence']<=>$b['sequence']);
 foreach($snap['events'] as $ev){$lotId=$ev['lotId'];$balances[$lotId]+=$ev['delta'];if($balances[$lotId]<0)v2Reply(422,['error'=>'Negative intermediate inventory']);if(in_array($ev['kind'],['acquisition','transfer_in'],true))$beginnings[$lotId]+=$ev['delta'];}
 foreach($lots as $l)if($beginnings[$l['id']]!==$l['quantityAcquired'])v2Reply(422,['error'=>'Lot acquisition quantity and historical events do not match']);
 foreach($transactions as $tx=>$items){$deltas=array_sum(array_column($items,'delta'));if($deltas!==0)v2Reply(422,['error'=>'Unbalanced transfer transaction']);}
 foreach($snap['reviews'] as $r){if(!is_array($r)||!v2Id($r['id']??null)||isset($reviews[$r['id']])||!isset($lots[$r['lotId']??''])||($lots[$r['lotId']]['cigarId']!==($r['cigarId']??null))||!v2Iso($r['occurredAt']??null)||!is_int($r['rating']??null)||$r['rating']<1||$r['rating']>5||!v2Text($r['notes']??null,1500,true)||!in_array($r['mode']??null,['quick','detailed'],true)||!v2Text($r['draw']??'',80)||!v2Text($r['construction']??'',80))v2Reply(422,['error'=>'Invalid journal record']);
  if(($r['thirds']??null)!==null){if(!is_array($r['thirds']))v2Reply(422,['error'=>'Invalid journal thirds']);foreach(['first','middle','final'] as $section)if(!v2Text($r['thirds'][$section]??'',500))v2Reply(422,['error'=>'Journal notes too long']);}
  $reviews[$r['id']]=true;
 }
 v2Published($pdo,$catalog);
 return ['snapshot'=>$snap,'counts'=>['humidors'=>count($snap['humidors']),'lots'=>count($snap['lots']),'events'=>count($snap['events']),'reviews'=>count($snap['reviews'])],'hash'=>hash('sha256',json_encode($body,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE))];
}
$route=trim((string)($_GET['route']??''),'/');$method=strtoupper((string)($_SERVER['REQUEST_METHOD']??'GET'));
try{
 $pdo=v2Db($cfg);
 $migration=$pdo->query("SELECT COUNT(*) FROM schema_migrations WHERE version='002_collection_v2'");
 if((int)$migration->fetchColumn()!==1)v2Reply(503,['error'=>'Collection v2 database migration required']);
 if($route==='capabilities'&&$method==='GET')v2Reply(200,['contract'=>'cigario.collection.v2','initialImport'=>true,'ongoingSync'=>false,'maxBodyBytes'=>2097152,'version'=>'2.0']);
 $uid=v2Owner($pdo);
 if($route==='snapshot'&&$method==='GET'){
  $q=$pdo->prepare('SELECT revision FROM collection_revisions WHERE user_id=?');$q->execute([$uid]);$revision=(int)($q->fetchColumn()?:0);
  $counts=[];foreach(['humidors','lots','stock_events','reviews'] as $table){$q=$pdo->prepare("SELECT COUNT(*) FROM $table WHERE user_id=?");$q->execute([$uid]);$counts[$table==='stock_events'?'events':$table]=(int)$q->fetchColumn();}
  v2Reply(200,['contract'=>'cigario.collection.v2','revision'=>$revision,'counts'=>$counts]);
 }
 if(in_array($route,['import/preview','import/commit'],true)&&$method==='POST'){
  v2Csrf();$raw=v2Body();$validation=v2Validate($pdo,$raw);$hash=$validation['hash'];$counts=$validation['counts'];
  if($route==='import/preview'){
   $q=$pdo->prepare('SELECT COUNT(*) FROM lots WHERE user_id=?');$q->execute([$uid]);$hasLots=(int)$q->fetchColumn()>0;
   $q=$pdo->prepare('SELECT COUNT(*) FROM humidors WHERE user_id=?');$q->execute([$uid]);$hasHumidors=(int)$q->fetchColumn()>0;
   $q=$pdo->prepare('SELECT revision FROM collection_revisions WHERE user_id=?');$q->execute([$uid]);$rev=(int)($q->fetchColumn()?:0);
   v2Reply(200,['valid'=>true,'canImport'=>!$hasLots&&!$hasHumidors&&$rev===0,'reason'=>$hasLots||$hasHumidors||$rev!==0?'Account collection is not empty':null,'counts'=>$counts,'revision'=>$rev,'requiresExplicitConfirmation'=>true]);
  }
  $pdo->beginTransaction();
  $pdo->prepare('INSERT INTO collection_revisions(user_id,revision) VALUES (?,0) ON DUPLICATE KEY UPDATE revision=revision')->execute([$uid]);
  $q=$pdo->prepare('SELECT revision FROM collection_revisions WHERE user_id=? FOR UPDATE');$q->execute([$uid]);$revision=(int)$q->fetchColumn();
  $q=$pdo->prepare('SELECT payload_hash,resulting_revision FROM collection_imports WHERE user_id=? AND mutation_id=?');$q->execute([$uid,$raw['clientMutationId']]);$existing=$q->fetch();
  if($existing){if(!hash_equals($existing['payload_hash'],$hash)){$pdo->rollBack();v2Reply(409,['error'=>'Mutation ID reused with a different payload']);}$pdo->commit();v2Reply(200,['ok'=>true,'duplicate'=>true,'revision'=>(int)$existing['resulting_revision']]);}
  if($revision!==0){$pdo->rollBack();v2Reply(409,['error'=>'Server collection has changed. Export and resolve before retrying']);}
  foreach(['lots','humidors','stock_events','reviews'] as $table){$q=$pdo->prepare("SELECT COUNT(*) FROM $table WHERE user_id=?");$q->execute([$uid]);if((int)$q->fetchColumn()!==0){$pdo->rollBack();v2Reply(409,['error'=>'Initial import requires an empty account']);}}
  $s=$validation['snapshot'];
  $q=$pdo->prepare('INSERT INTO humidors(id,user_id,name,notes) VALUES (?,?,?,?)');foreach($s['humidors'] as $h)$q->execute([$h['id'],$uid,$h['name'],$h['notes']]);
  $q=$pdo->prepare('INSERT INTO lots (id,user_id,cigar_id,humidor_id,origin_lot_id,mutation_id,acquired_at,location,source,quantity_acquired,price_paid_cents,allocated_cost_cents,format,memo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  foreach($s['lots'] as $l)$q->execute([$l['id'],$uid,$l['cigarId'],$l['humidorId'],$l['originLotId'],$l['id'],$l['acquiredAt'],$l['location'],$l['source'],$l['quantityAcquired'],$l['pricePaidCents'],$l['allocatedCostCents']??null,$l['format'],$l['memo']]);
  $q=$pdo->prepare('INSERT INTO stock_events(id,user_id,lot_id,mutation_id,delta,kind,occurred_at,note,transaction_id,event_sequence) VALUES (?,?,?,?,?,?,?,?,?,?)');
  foreach($s['events'] as $ev)$q->execute([$ev['id'],$uid,$ev['lotId'],$ev['id'],$ev['delta'],$ev['kind'],str_replace(['T','Z'],[' ',''],$ev['occurredAt']),$ev['note'],$ev['transactionId'],$ev['sequence']]);
  $q=$pdo->prepare('INSERT INTO reviews(id,user_id,cigar_id,lot_id,rating,notes,occurred_at,mode,thirds_json,draw_note,construction_note) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  foreach($s['reviews'] as $r)$q->execute([$r['id'],$uid,$r['cigarId'],$r['lotId'],$r['rating'],$r['notes'],str_replace(['T','Z'],[' ',''],$r['occurredAt']),$r['mode'],$r['thirds']===null?null:json_encode($r['thirds'],JSON_UNESCAPED_UNICODE),$r['draw'],$r['construction']]);
  $pdo->prepare('UPDATE collection_revisions SET revision=1 WHERE user_id=?')->execute([$uid]);
  $pdo->prepare('INSERT INTO collection_imports(user_id,mutation_id,device_id,payload_hash,resulting_revision) VALUES (?,?,?,?,1)')->execute([$uid,$raw['clientMutationId'],$raw['deviceId'],$hash]);
  $pdo->commit();v2Reply(201,['ok'=>true,'duplicate'=>false,'revision'=>1,'counts'=>$counts]);
 }
 v2Reply(404,['error'=>'Endpoint not found']);
}catch(PDOException $e){error_log('Cigario v2 DB: '.$e->getMessage());if(isset($pdo)&&$pdo->inTransaction())$pdo->rollBack();v2Reply($e->getCode()==='23000'?409:500,['error'=>'Database request failed']);}
 catch(Throwable $e){error_log('Cigario v2: '.$e->getMessage());if(isset($pdo)&&$pdo->inTransaction())$pdo->rollBack();v2Reply(500,['error'=>'Unexpected server error']);}
