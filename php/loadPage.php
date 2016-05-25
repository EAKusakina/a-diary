<?php 
include_once 'Support/ErrorsAndExceptions.php';

	// Подгружает страницу, указаную в $_POST['uri']
	$ajax = true; 
	$uri = trim(strip_tags($_POST['uri']));
		
	if ($uri == '../index.php'){
		include '../inc/index.inc.php';
		die();
	}
	
	//убедились, что uri не пустой и в нем адрес, предназначенный для включения в основную страницу
	if(!empty($uri)){
		if ((include $uri) == false) {
			if ((include '../inc/pageNotFound.inc.php') == false) {
				http_response_code(404);
				header('HTTP/1.1 404 Not Found');
				header('Status: 404 Not Found');
				file_put_contents(CLIENT_ERROR, "Не найдена страница pageNotFound.inc.php \n", FILE_APPEND | LOCK_EX | FILE_USE_INCLUDE_PATH);			
				die();						
			}
		}			
	} 
	