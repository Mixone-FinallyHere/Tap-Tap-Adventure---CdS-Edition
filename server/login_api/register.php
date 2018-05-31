<?php
require('config.php');

if (isset($_REQUEST['u']) and $_REQUEST['a'] == '9a4c5ddb-5ce6-4a01-a14f-3ae49d8c6507'){
    if ($_REQUEST['u'] == $_REQUEST['p']) {
        http_response_code(500);
        break;
    } else {
        // removes backslashes
        $username = stripslashes($_REQUEST['u']);
        //escapes special characters in a string
	    $username = mysqli_real_escape_string($con,$username); 
	    $query = "SELECT * FROM player_data WHERE username='".$username."'";
	    $result = mysqli_query($con,$query) or die(mysql_error());
	    $rows = mysqli_num_rows($result);
        if($rows == 1){
	        http_response_code(401);
            break;
        } else {
	        $email = stripslashes($_REQUEST['e']);
	        $email = mysqli_real_escape_string($con,$email);
	        $query = "SELECT * FROM player_data WHERE email='".$email."'";
	        $result = mysqli_query($con,$query) or die(mysql_error());
	        $rows = mysqli_num_rows($result);
	        if($rows == 1){
	            http_response_code(500);
                break;
            } else {
                http_response_code(200);
            }
        }
    }
}else{
    http_response_code(600);
}

?>
