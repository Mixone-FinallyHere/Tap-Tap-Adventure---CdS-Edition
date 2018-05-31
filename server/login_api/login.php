<?php
require('config.php');
session_start();

if (isset($_POST['username'])){
    // removes backslashes
	$username = stripslashes($_REQUEST['username']);
    //escapes special characters in a string
	$username = mysqli_real_escape_string($con,$username);
	$password = stripslashes($_REQUEST['password']);
	$password = mysqli_real_escape_string($con,$password);
	//Checking is user existing in the database or not
    $query = "SELECT * FROM player_data WHERE username='".$username."'and password='".$password."'";
	$result = mysqli_query($con,$query) or die(mysql_error());
	$rows = mysqli_num_rows($result);
    if($rows != 1){
	    $data = "error";
        header('Content-Type: application/json');
        echo json_encode($data);
    }
}else{
    $data = "error";
    header('Content-Type: application/json');
    echo json_encode($data);

}
?>
