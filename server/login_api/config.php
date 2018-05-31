<?php
$host = "localhost";
$user = "taptaphelper";
$pass = "taptaptapping";
$con = mysqli_connect($host, $user, $pass,"taptap");
// Check connection
if (mysqli_connect_errno())
{
  echo "Failed to connect to MySQL: " . mysqli_connect_error();
}
?>
