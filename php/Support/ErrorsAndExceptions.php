<?php
//содержит функции и класс для обработки ошибок и исключений

// определеяем уровень протоколирования ошибок
error_reporting(E_ALL | E_STRICT);

// определяем режим вывода ошибок
ini_set('display_errors', 'On');

// включаем буфферизацию вывода (вывод скрипта сохраняется во внутреннем буфере)
ob_start();

// устанавливаем пользовательский обработчик ошибок
set_error_handler("error_handler");

// регистрируем функцию, которая выполняется после завершения работы скрипта (например, после фатальной ошибки)
register_shutdown_function('fatal_error_handler');

//определяем константы, содержащие имена логов ошибок
define ("SERVER_ERROR", "server_error.txt");
define ("CLIENT_ERROR", "client_error.txt");

//тут указываем папку, в которой file_put_contents и file_get_contents будут искать файлы с логами ошибок и доступом к БД 
ini_set('include_path', 'php');

//обработчик ошибок (используется вместо внутреннего обработчика PHP)
function error_handler($errno, $errstr, $errfile, $errline)
{
    // если ошибка попадает в отчет (при использовании оператора "@" error_reporting() вернет 0)
    if (error_reporting() & $errno)
    {
        $errors = array(
            1 => 'E_ERROR',
            2 => 'E_WARNING',
            4 => 'E_PARSE',
            8 => 'E_NOTICE',
            16 => 'E_CORE_ERROR',
            32 => 'E_CORE_WARNING',
            64 => 'E_COMPILE_ERROR',
            128 => 'E_COMPILE_WARNING',
            256 => 'E_USER_ERROR',
            512 => 'E_USER_WARNING',
            1024 => 'E_USER_NOTICE',
            2048 => 'E_STRICT',
            4096 => 'E_RECOVERABLE_ERROR',
            8192 => 'E_DEPRECATED',
            16384 => 'E_USER_DEPRECATED',
		);
        //формируем свое сообщение об ошибке
        $e = $errors[$errno].", текст: $errstr (в $errfile на $errline строке) \n";
		$path = SERVER_ERROR;
		if (in_array($errno, [1, 4, 16, 64]))
			$e = "Фатальная ошибка: ". $e;
		//выводим ошибки в лог
		file_put_contents($path, $e."\n", FILE_APPEND | LOCK_EX | FILE_USE_INCLUDE_PATH);
    }
    // не запускаем внутренний обработчик ошибок PHP
    return true;
}

//перехватывает фатальные ошибки
function fatal_error_handler() {
	//получаем последнюю ошибку
    $error = error_get_last();
    if (
        // если в коде была допущена ошибка
        is_array($error) &&
        // и это одна из фатальных ошибок
        in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])
    ) {
        // запускаем обработчик ошибок
        error_handler($error['type'], $error['message'], $error['file'], $error['line']);
		// очищаем буффер (не выводим стандартное сообщение об ошибке)
        ob_end_clean();
		throw new ExceptionForUser("Сервер находится на техническом обслуживании, попробуйте повторить операцию позднее", 500);
    } else  {
        // отправка (вывод) буфера и его отключение 
        ob_end_flush();
    }	
}

//класс для отправки пользователю ошибок, возникших из-за проблем на сервере
class ExceptionForUser extends Exception {

	public $message;
    public $code;

	public function __construct($message = "", $code = "") {
        $this->message = $message;
        $this->code = $code;
		
		switch ($this->code) {
			case 500:
				// когда не можем подключиться к БД или произошла какая-то фатальная ошибка
				http_response_code(500);
				header('HTTP/1.1 500 Internal Server Error');
				header('Status: 500 Internal Server Error');
				die($this->message);			
			case 503:
				// когда сервер работает, но по каким-то причинам не может обрабатывать запросы
				http_response_code(503);
				header('HTTP/1.1 503 Service Unavailable');
				header('Status: 503 Service Unavailable');
				//чтобы прислали повторный запрос через час
				header('Retry-After: 3600');
				die($this->message);			
		}
    }
}