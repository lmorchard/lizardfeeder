<?php
/**
 * Simple proxy to JSON files with optional ?callback parameter
 */

// Make sure the incoming path resolves safely, and that it ends in .json
$BASE_DIR = dirname(__FILE__);
$path_in  = $BASE_DIR.$_SERVER['PATH_INFO'];
$r_path   = realpath($path_in);
if (!$r_path || $r_path != $path_in || 
        substr($r_path, strlen($r_path) - 5) != '.json') {
    header("HTTP/1.1 404 Not Found");
    echo "{}\n";
    exit();
}

// Fetch the JSON file contents
$out = file_get_contents($r_path);

// Accept a ?callback parameter.
if (!isset($_GET['callback'])) {
    $callback = FALSE;
} else {
    // Pass the callback parameter through a whitelist to help prevent some 
    // potential XSS issues.
    $callback = preg_replace(
        '/[^0-9a-zA-Z\(\)\[\]\,\.\_\-\+\=\/\|\\\~\?\!\#\$\^\*\: \'\"]/', '', 
        $_GET['callback']
    );
}

// Finally, spit out the JSON, including the callback if supplied.
header('Content-Type: application/json');
if ($callback) echo "$callback(";
echo $out;
if ($callback) echo ")";
