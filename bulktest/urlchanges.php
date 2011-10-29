<?php
/*
Copyright 2010 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

require_once("../utils.inc");
require_once("../dbapi.inc");

$query = "select count(*) from $gUrlsChangeTableDesktop;";
$num = doSimpleQuery($query);
if ( 0 < $num ) {
   echo "There " . ( 1 == $num ? "is" : "are" ) . " $num URL " . ( 1 == $num ? "change" : "changes" ) . " in the queue.\n";
}

?>
