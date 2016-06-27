<?php 
include_once 'Support/ErrorsAndExceptions.php';

	/* получает содержимое страницы, указаной в $_POST['namePage']; 
	вызывается из init.js и используется для заполнения страниц контентом;
	все подгружаемые страницы лежат в папке "inc"*/
	$ajax = true; 
	$namePage = trim(strip_tags($_POST['namePage']));

	//убедились, что namePage не пустой и в нем адрес, предназначенный для включения в основную страницу
	if(!empty($namePage)){
		//если подключить страницу не удалось
		if ((include $namePage) == false) {
			//пробуем показать страницу pageNotFound (404 ошибка)
			if ((include '../inc/pageNotFound.inc.php') == false) {
				//иначе выводим сообщение об ошибке
				http_response_code(404);
				header('HTTP/1.1 404 Not Found');
				header('Status: 404 Not Found');
				//и записываем в лог ошибок, что пропала pageNotFound
				file_put_contents(CLIENT_ERROR, "Не найдена страница pageNotFound.inc.php \n", FILE_APPEND | LOCK_EX | FILE_USE_INCLUDE_PATH);			
				die();						
			}
		}			
	} 
	