<?php
declare(strict_types=1);

// Cigario v1 API: PHP 8.2+, MariaDB. Deploy with its private config OUTSIDE public_html.
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $data): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}
function config(): array {
    $root = $_SERVER['DOCUMENT_ROOT'] ?? '';
    $file = getenv('CIGARIO_CONFIG_FILE') ?: dirname($root !== '' ? $root : __DIR__) . '/cigario-config.php';
    if (!is_file($file)) return [];
    $value = require $file;
    return is_array($value) ? $value : [];
}
$cfg = config();
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $allowed = $cfg['allowed_origins'] ?? [];
    if (!in_array($origin, $allowed, true)) respond(403, ['error' => 'Origin not allowed']);
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token, X-Cigario-Client');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') respond(204, []);
$isHttps = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
if (!$isHttps && !(($cfg['allow_insecure_local'] ?? false) && in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1','::1'], true))) {
    respond(403, ['error' => 'HTTPS required']);
}
session_name('cigario_session');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $isHttps, 'httponly' => true, 'samesite' => 'Lax']);
if (session_status() !== PHP_SESSION_ACTIVE) session_start();
$_SESSION['csrf'] ??= bin2hex(random_bytes(24));

function db(array $cfg): PDO {
    foreach (['db_host','db_name','db_user','db_password'] as $field) {
        if (!isset($cfg[$field]) || !is_string($cfg[$field])) respond(503, ['error' => 'Database not configured']);
    }
    $dsn = 'mysql:host=' . $cfg['db_host'] . ';dbname=' . $cfg['db_name'] . ';charset=utf8mb4';
    return new PDO($dsn, $cfg['db_user'], $cfg['db_password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]);
}
function body(): array {
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 32768) respond(413, ['error' => 'Request too large']);
    $raw = file_get_contents('php://input', false, null, 0, 32769);
    if (!is_string($raw) || strlen($raw) > 32768) respond(413, ['error' => 'Request too large']);
    $data = json_decode($raw, true);
    if (!is_array($data)) respond(400, ['error' => 'Expected JSON object']);
    return $data;
}
function csrf(): void {
    if (!hash_equals((string)($_SESSION['csrf'] ?? ''), (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''))) {
        respond(403, ['error' => 'CSRF token invalid']);
    }
}
function bearer(): ?string {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    return preg_match('/^Bearer ([a-f0-9]{64})$/i', $header, $m) ? $m[1] : null;
}
function owner(PDO $pdo): string {
    if ($token = bearer()) {
        $statement = $pdo->prepare('SELECT user_id FROM api_tokens WHERE token_hash = ? AND expires_at > UTC_TIMESTAMP() LIMIT 1');
        $statement->execute([hash('sha256', $token)]);
        $row = $statement->fetch();
        if ($row) return (string)$row['user_id'];
        respond(401, ['error' => 'Invalid or expired access token']);
    }
    if (!empty($_SESSION['user_id']) && is_string($_SESSION['user_id'])) return $_SESSION['user_id'];
    respond(401, ['error' => 'Sign in required']);
}
function requireWriteToken(): void { if (bearer() === null) csrf(); }
function validId(mixed $value): string {
    if (!is_string($value) || !preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i', $value)) respond(422, ['error' => 'Invalid UUID']);
    return $value;
}
function strField(array $data, string $field, int $limit = 255, bool $required = true): string {
    $s = $data[$field] ?? '';
    if (!is_string($s)) respond(422, ['error' => "Invalid {$field}"]);
    $s = trim($s);
    if (($required && $s === '') || mb_strlen($s) > $limit) respond(422, ['error' => "Invalid {$field}"]);
    return $s;
}
function validDate(mixed $d): string {
    if (!is_string($d) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) || DateTimeImmutable::createFromFormat('!Y-m-d', $d)?->format('Y-m-d') !== $d) respond(422, ['error' => 'Invalid date']);
    return $d;
}
function issueToken(PDO $pdo, string $userId): string {
    $token = bin2hex(random_bytes(32));
    $stmt = $pdo->prepare('INSERT INTO api_tokens (id,user_id,token_hash,expires_at) VALUES (?,?,?,DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY))');
    $stmt->execute([uuidv4(), $userId, hash('sha256', $token)]);
    return $token;
}
function uuidv4(): string {
    $bytes = random_bytes(16); $bytes[6] = chr((ord($bytes[6]) & 15) | 64); $bytes[8] = chr((ord($bytes[8]) & 63) | 128);
    $h = bin2hex($bytes); return substr($h,0,8).'-'.substr($h,8,4).'-'.substr($h,12,4).'-'.substr($h,16,4).'-'.substr($h,20);
}
function makeSession(string $userId): void { session_regenerate_id(true); $_SESSION['user_id'] = $userId; $_SESSION['csrf'] = bin2hex(random_bytes(24)); }
function authResult(PDO $pdo, string $userId, string $email): array {
    $result = ['user' => ['id' => $userId, 'email' => $email], 'csrf' => (string)$_SESSION['csrf']];
    // Native token is optional; it must be held in iOS Keychain / Android Keystore, never browser localStorage.
    if (($_SERVER['HTTP_X_CIGARIO_CLIENT'] ?? '') === 'native') $result['accessToken'] = issueToken($pdo, $userId);
    return $result;
}
function eventRows(PDO $pdo, string $userId): array {
    $q = $pdo->prepare('SELECT e.id,e.lot_id AS lotId,e.delta,e.kind,DATE(e.occurred_at) AS at,e.note FROM stock_events e WHERE e.user_id=? ORDER BY e.occurred_at DESC, e.created_at DESC');
    $q->execute([$userId]); $result = $q->fetchAll();
    foreach ($result as &$row) $row['delta'] = (int)$row['delta'];
    return $result;
}
function inventory(PDO $pdo, string $userId): array {
    $q = $pdo->prepare('SELECT id,cigar_id AS cigarId,DATE(acquired_at) AS acquiredAt,location,source,quantity_acquired AS quantityAcquired,price_paid_cents AS pricePaidCents,format,memo FROM lots WHERE user_id=? ORDER BY acquired_at DESC, created_at DESC');
    $q->execute([$userId]); $lots = $q->fetchAll();
    foreach ($lots as &$lot) { $lot['quantityAcquired'] = (int)$lot['quantityAcquired']; $lot['pricePaidCents'] = $lot['pricePaidCents'] === null ? null : (int)$lot['pricePaidCents']; }
    $q = $pdo->prepare('SELECT id,cigar_id AS cigarId,lot_id AS lotId,rating,notes,DATE(created_at) AS at FROM reviews WHERE user_id=? ORDER BY created_at DESC');
    $q->execute([$userId]); $reviews = $q->fetchAll(); foreach ($reviews as &$r) $r['rating'] = (int)$r['rating'];
    return ['lots' => $lots, 'events' => eventRows($pdo, $userId), 'reviews' => $reviews];
}

$route = trim((string)($_GET['route'] ?? ''), '/');
$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
try {
    if ($route === 'health' && $method === 'GET') respond(200, ['service' => 'cigario-v1', 'ok' => true, 'configured' => isset($cfg['db_host'], $cfg['db_name'], $cfg['db_user'], $cfg['db_password'])]);
    if ($route === 'auth/csrf' && $method === 'GET') respond(200, ['csrf' => (string)$_SESSION['csrf']]);
    $pdo = db($cfg);
    if ($route === 'catalog' && $method === 'GET') {
        $q = $pdo->query('SELECT id,name,origin,vitola,size,wrapper,binder,filler,strength,notes_json,description,msrp_cents AS msrpCents,tone FROM cigar_catalog WHERE published=1 ORDER BY name LIMIT 500');
        $rows = $q->fetchAll(); foreach ($rows as &$r) { $r['strength'] = (int)$r['strength']; $r['msrpCents'] = $r['msrpCents']===null?null:(int)$r['msrpCents']; $r['notes'] = json_decode((string)$r['notes_json'], true) ?: []; unset($r['notes_json']); }
        respond(200, ['catalog' => $rows]);
    }
    if ($route === 'auth/register' && $method === 'POST') {
        csrf(); if (!($cfg['registration_enabled'] ?? false)) respond(403, ['error' => 'Registration not enabled']);
        $input = body(); $email = strtolower(strField($input, 'email', 190)); $password = strField($input, 'password', 1024);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 12) respond(422, ['error' => 'Use a valid email and password of at least 12 characters']);
        $id = uuidv4(); $pdo->prepare('INSERT INTO users (id,email,password_hash) VALUES (?,?,?)')->execute([$id,$email,password_hash($password,PASSWORD_DEFAULT)]);
        makeSession($id); respond(201, authResult($pdo,$id,$email));
    }
    if ($route === 'auth/login' && $method === 'POST') {
        csrf(); $input=body(); $email=strtolower(strField($input,'email',190)); $password=strField($input,'password',1024);
        $fingerprint=hash('sha256',strtolower($email).'|'.($_SERVER['REMOTE_ADDR'] ?? 'unknown').'|'.($cfg['auth_rate_salt'] ?? 'cigario'));
        $q=$pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE fingerprint=? AND attempted_at > DATE_SUB(UTC_TIMESTAMP(),INTERVAL 15 MINUTE)');$q->execute([$fingerprint]);
        if ((int)$q->fetchColumn()>=8) respond(429,['error'=>'Too many sign-in attempts. Try later.']);
        $q=$pdo->prepare('SELECT id,email,password_hash FROM users WHERE email=? LIMIT 1');$q->execute([$email]);$user=$q->fetch();
        if (!$user || !password_verify($password,(string)$user['password_hash'])) {
            $pdo->prepare('INSERT INTO login_attempts (fingerprint) VALUES (?)')->execute([$fingerprint]);
            respond(401,['error'=>'Invalid sign-in credentials']);
        }
        $pdo->prepare('DELETE FROM login_attempts WHERE fingerprint=?')->execute([$fingerprint]);
        makeSession((string)$user['id']);respond(200,authResult($pdo,(string)$user['id'],(string)$user['email']));
    }
    if ($route === 'auth/logout' && $method === 'POST') {
        requireWriteToken();
        if ($token=bearer()) $pdo->prepare('DELETE FROM api_tokens WHERE token_hash=?')->execute([hash('sha256',$token)]);
        unset($_SESSION['user_id']); session_regenerate_id(true); $_SESSION['csrf'] = bin2hex(random_bytes(24));
        respond(200,['ok'=>true]);
    }
    if ($route === 'auth/me' && $method === 'GET') {
        $id=owner($pdo);$q=$pdo->prepare('SELECT id,email FROM users WHERE id=? LIMIT 1');$q->execute([$id]);$user=$q->fetch();
        if (!$user) respond(401,['error'=>'Account not found']);respond(200,['user'=>$user]);
    }
    if ($route === 'inventory' && $method === 'GET') respond(200,inventory($pdo,owner($pdo)));
    if ($route === 'lots' && $method === 'POST') {
        requireWriteToken();$uid=owner($pdo);$d=body();
        $id=validId($d['id']??null);$mutation=validId($d['mutationId']??null);$cigar=strField($d,'cigarId',64);
        $count=$d['quantityAcquired']??null;$cost=$d['pricePaidCents']??null;$fmt=strField($d,'format',8);
        if (!is_int($count)||$count<1||$count>100000||($cost!==null&&(!is_int($cost)||$cost<0))||!in_array($fmt,['Single','Pack','Box'],true)) respond(422,['error'=>'Invalid lot quantity, format or cost']);
        $date=validDate($d['acquiredAt']??null);$location=strField($d,'location',160);$source=strField($d,'source',190,false);$memo=strField($d,'memo',2000,false);
        $pdo->beginTransaction();
        $exists=$pdo->prepare('SELECT id FROM lots WHERE user_id=? AND mutation_id=?');$exists->execute([$uid,$mutation]);
        if ($row=$exists->fetch()) { $pdo->commit();respond(200,['id'=>$row['id'],'duplicate'=>true]); }
        $q=$pdo->prepare('SELECT 1 FROM cigar_catalog WHERE id=? AND published=1');$q->execute([$cigar]);if(!$q->fetch()){$pdo->rollBack();respond(422,['error'=>'Catalog item does not exist']);}
        $pdo->prepare('INSERT INTO lots (id,user_id,cigar_id,mutation_id,acquired_at,location,source,quantity_acquired,price_paid_cents,format,memo) VALUES (?,?,?,?,?,?,?,?,?,?,?)')->execute([$id,$uid,$cigar,$mutation,$date,$location,$source,$count,$cost,$fmt,$memo]);
        $pdo->prepare('INSERT INTO stock_events (id,user_id,lot_id,mutation_id,delta,kind,occurred_at,note) VALUES (?,?,?,?,?,\'acquisition\',?,?)')->execute([uuidv4(),$uid,$id,uuidv4(),$count,$date,$source]);
        $pdo->commit();respond(201,['id'=>$id,'duplicate'=>false]);
    }
    if ($route === 'events' && $method === 'POST') {
        requireWriteToken();$uid=owner($pdo);$d=body();$lotId=validId($d['lotId']??null);$mutation=validId($d['mutationId']??null);
        if (($d['kind']??null)!=='consumed'||($d['delta']??null)!==-1) respond(422,['error'=>'Only single-unit inventory consumption is supported']);
        $pdo->beginTransaction();
        $q=$pdo->prepare('SELECT id FROM stock_events WHERE user_id=? AND mutation_id=?');$q->execute([$uid,$mutation]);if($q->fetch()){$pdo->commit();respond(200,['ok'=>true,'duplicate'=>true]);}
        $q=$pdo->prepare('SELECT id FROM lots WHERE id=? AND user_id=? FOR UPDATE');$q->execute([$lotId,$uid]);if(!$q->fetch()){$pdo->rollBack();respond(404,['error'=>'Lot not found']);}
        $q=$pdo->prepare('SELECT COALESCE(SUM(delta),0) FROM stock_events WHERE user_id=? AND lot_id=?');$q->execute([$uid,$lotId]);
        if((int)$q->fetchColumn()<1){$pdo->rollBack();respond(409,['error'=>'No remaining inventory']);}
        $pdo->prepare('INSERT INTO stock_events (id,user_id,lot_id,mutation_id,delta,kind,occurred_at,note) VALUES (?,?,?,?, -1,\'consumed\',UTC_TIMESTAMP(),?)')->execute([uuidv4(),$uid,$lotId,$mutation,'Personal journal entry']);
        $pdo->commit();respond(201,['ok'=>true,'duplicate'=>false]);
    }
    if ($route === 'reviews' && $method === 'POST') {
        requireWriteToken();$uid=owner($pdo);$d=body();$cigar=strField($d,'cigarId',64);$notes=strField($d,'notes',1500);$rating=$d['rating']??null;
        if(!is_int($rating)||$rating<1||$rating>5)respond(422,['error'=>'Invalid rating']);
        $lot=isset($d['lotId'])?validId($d['lotId']):null;
        if($lot!==null){$q=$pdo->prepare('SELECT 1 FROM lots WHERE id=? AND user_id=? AND cigar_id=?');$q->execute([$lot,$uid,$cigar]);if(!$q->fetch())respond(404,['error'=>'Lot not found']);}
        $id=validId($d['id']??null);$pdo->prepare('INSERT INTO reviews (id,user_id,lot_id,cigar_id,rating,notes) VALUES (?,?,?,?,?,?)')->execute([$id,$uid,$lot,$cigar,$rating,$notes]);
        respond(201,['id'=>$id]);
    }
    respond(404,['error'=>'Endpoint not found']);
} catch (PDOException $e) {
    error_log('Cigario database exception: '.$e->getMessage());
    if(isset($pdo)&&$pdo->inTransaction())$pdo->rollBack();
    if($e->getCode()==='23000')respond(409,['error'=>'Duplicate or conflicting record']);
    respond(500,['error'=>'Database operation failed']);
} catch (Throwable $e) {
    error_log('Cigario API error: '.$e->getMessage());
    if(isset($pdo)&&$pdo->inTransaction())$pdo->rollBack();
    respond(500,['error'=>'Unexpected server error']);
}
