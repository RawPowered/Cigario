<?php
// Copy to ~/cigario-config.php (one level ABOVE public_html). Never commit real secrets.
return [
    'db_host' => 'localhost',
    'db_name' => 'cpanelprefix_cigario',
    'db_user' => 'cpanelprefix_cigario',
    'db_password' => 'REPLACE_ME_WITH_A_LONG_RANDOM_PASSWORD',
    'registration_enabled' => false,
    'auth_rate_salt' => 'REPLACE_ME_WITH_RANDOM_SECRET',
    // Use exact origins, no wildcards. Add native origins only after native auth is secured.
    'allowed_origins' => ['https://YOUR-CIGARIO-DOMAIN.example'],
    'allow_insecure_local' => false,
];
