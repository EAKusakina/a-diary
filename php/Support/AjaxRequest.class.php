<?php
include_once 'DataBase.trait.php';

/*
 * Обертка для работы с Ajax-запросами.
 Этот класс облегчит нам обработку данных, отправленных пользователем из формы. В качестве конструктора, он принимает массив с данными запроса ($_GET или $_POST).
*/

class AjaxRequest
{
	use DataBase;

    public $actions = array();

    public $data;
    public $code;
    public $message;
    public $status;
	
	/*	Данный конструктор будет использован при создании объекта от класса-потомка(AuthorizationAjaxRequest), в качесвте request передается $_REQUEST*/	
    public function __construct($request)
    {
        //если запрос пришел не методом POST, тогда ошибка
		if ($_SERVER["REQUEST_METHOD"] !== "POST") {
			// Method Not Allowed
			http_response_code(405);
			header('HTTP/1.1 405 Method Not Allowed');
			header('Status: 405 Method Not Allowed');
			header("Allow: POST");
			file_put_contents(CLIENT_ERROR, "Класс: ".get_class($this).", функция: ".__FUNCTION__.". Запрос был осуществлен методом ".$_SERVER["REQUEST_METHOD"]." \n", FILE_APPEND | LOCK_EX | FILE_USE_INCLUDE_PATH);			
			die();
		}
		$this->request = $request;
		/*В запросе обязательно должно быть поле act, которое определяет текущее действие. Например, при регистрации значением $_POST["act"] будет «register», а при авторизации — «login».*/
        $this->action = $this->getRequestParam("act");
		if (is_null($this->action) || empty($this->actions[$this->action])){
			http_response_code(400);
            header("HTTP/1.1 400 Bad Request");
			header('Status: 400 Bad Request');
			file_put_contents(CLIENT_ERROR, "Класс: ".get_class($this).", функция: ".__FUNCTION__.". Передан неверный параметр act: ".$this->action." \n", FILE_APPEND | LOCK_EX | FILE_USE_INCLUDE_PATH);			
			die();
		}

		//получили функцию, которую нужно вызвать (login, logout, register)
		$this->callback = $this->actions[$this->action];
		call_user_func(array($this, $this->callback));/*Вызывает пользовательскую функцию, указанную в первом параметре, второй параметр - аргумент для функции. Вызываемая функция типа callable. Callable — это специальный псевдотип данных в PHP, означающий «нечто, что может быть вызвано как функция».Массивы в PHP тоже могут быть callable!
		https://habrahabr.ru/post/259991/
		Итак, массив, в котором нулевой элемент — это имя класса, а первый — имя статического метода, является callable. Ровно также, как и массив, состоящий из объекта и имени его динамического метода.
		У нас для созданного объекта $ajaxRequest вызываем login/logout/register */
    }

	public function handleContent($content) {
		if ( is_null($content) || is_null($arr = json_decode($content)) ) {
            http_response_code(400);
			header("HTTP/1.1 400 Bad Request");
			header('Status: 400 Bad Request');
			file_put_contents(CLIENT_ERROR, "Класс: ".get_class($this).", функция: ".__FUNCTION__.". Передан неверный параметр json_string: ".$content." \n", FILE_APPEND | LOCK_EX | FILE_USE_INCLUDE_PATH);			
			die();
		}
		return $arr;
	}
	public function getUserID() {
//тестировать неработающий server start
//		header('Location: http://food.diary/index.php?id=today');
		$this->userAuthorized();
		if	(empty($this->user_id)){
			$this->setFieldError("Email", "Пользователь не авторизован");
			return;				
		}
		$this->status = "ok";
		$this->data = $this->user_id;		
	}	
	
	//нужен для получения параметра из запроса. Он делает дополнительную проверку на существование ключа массива и возвращает null, если запрос не содержит нужных данных.
    public function getRequestParam($name)
    {
        //если в $_REQUEST существует элемент с ключом name (username, password1, password2) 
		if (array_key_exists($name, $this->request)) {
			//то вернем его значение
            return trim($this->request[$name]);
        }
        return null;			
    }

	//используется для формирования ответа. 
    public function setResponse($key, $value)
    {
        $this->data[$key] = $value;
    }

	//нужен для передачи сообщения об ошибке в поле формы.
    public function setFieldError($name, $message = "")
    {
        $this->status = "err";
        $this->code = $name;
        $this->message = $message;
    }

	//превращает параметры в JSON-строку
    public function renderToString()
    {
        $this->json = array(
            "status" => $this->status,
            "code" => $this->code,
            "message" => $this->message,
            "data" => $this->data,
        );
		//возвращает JSON-представление данных
		//ENT_NOQUOTES	Оставляет без изменения как двойные, так и одинарные кавычки.
        return json_encode($this->json, ENT_NOQUOTES);
    }

	//Для того, чтобы вернуть ответ пользователю, 
    public function showResponse()
    {
		header("Content-Type: application/json; charset=UTF-8");
        $this->response = $this->renderToString();
		echo $this->response;
    }
	
	public function sendMail($to, $activation){
		$base_url='http://food.diary/email_activation/';
		$subj = "Регистрация на сайте Food Diary";
		$body = "Спасибо!\n Вы успешно зарегистрировались на сайте Food Diary.\n\n Для подтверждения регистрации, пожалуйста, перейдите по ссылке: http://food.diary/index.php?code=".$activation."\n";
		return mail($to, $subj, $body);
	}
}