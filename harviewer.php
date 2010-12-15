var HARjson = 
<?php
require_once("utils.php");

$target = $_GET['f'];
echo getHarFileContents($target) . ";\n";
?>

