<?php
include_once 'DataBase.trait.php';

//Обертка для работы с Ajax-запросами.
//Облегчает обработку данных, отправленных клиентом (проверяет корректность данных, тип запроса, формирует ответ клиенту и др.)
class AjaxRequest
{
	//использует трейт, в котором определены методы для работы с сессиями и БД
	use DataBase;
	//массив с названиями вызываемых методов (заполняется в классах-потомках: AuthorizationAjaxRequest, Category, Event)
    public $actions = array();
	//свойства, в которых сохраняется ответ клиенту
    public $status;
    public $data;
    public $code;
    public $message;
	
	//конструктор используется при создании объекта от класса-потомка(AuthorizationAjaxRequest), в качесвте request передается $_REQUEST	
    public function __construct($request)
    {
		//http_host потребуется при формировании ссылок, в том числе при отправке письма с просьбой подтвердить e-mail
		$this->http_host = $_SERVER['HTTP_HOST'];		
		if (is_null($this->http_host) || empty ($this->http_host))
			$this->http_host = "a-diary.ru"; 
		//если запрос пришел не методом POST, тогда ошибка
		if ($_SERVER["REQUEST_METHOD"] !== "POST") {
			// Method Not Allowed
			http_response_code(405);
			header('HTTP/1.1 405 Method Not Allowed');
			header('Status: 405 Method Not Allowed');
			header("Allow: POST");
			file_put_contents(CLIENT_ERROR, "Класс: ".get_class($this).", метод: ".__FUNCTION__.". Запрос был осуществлен методом ".$_SERVER["REQUEST_METHOD"]." \n", FILE_APPEND | LOCK_EX | FILE_USE_INCLUDE_PATH);			
			die();
		}
		$this->request = $request;
		/*В запросе обязательно должно быть поле act, которое определяет вызываемый метод. Например, при регистрации значением $_POST["act"] будет «register», а при авторизации — «login».*/
        $this->action = $this->getRequestParam("act");
        $this->user_id = $this->getRequestParam("user_id");
		//если в зпросе нет поля act или оно пустое, тогда ошибка
		if (is_null($this->action) || empty($this->actions[$this->action])){
			http_response_code(400);
            header("HTTP/1.1 400 Bad Request");
			header('Status: 400 Bad Request');
			file_put_contents(CLIENT_ERROR, "Класс: ".get_class($this).", метод: ".__FUNCTION__.". Передан неверный параметр act: ".$this->action." \n", FILE_APPEND | LOCK_EX | FILE_USE_INCLUDE_PATH);			
			die();
		}

		//получили метод, который нужно вызвать (login, logout, register и др.)
		$this->callback = $this->actions[$this->action];
		call_user_func(array($this, $this->callback));/*Вызывает пользовательскую функцию, указанную в первом параметре, второй параметр - аргумент для функции. Вызываемая функция типа callable. Callable — это специальный псевдотип данных в PHP, означающий «нечто, что может быть вызвано как функция».Массивы в PHP тоже могут быть callable!
		https://habrahabr.ru/post/259991/
		Итак, массив, в котором нулевой элемент — это имя класса, а первый — имя статического метода, является callable. Ровно также, как и массив, состоящий из объекта и имени его динамического метода.*/		
    }
	
	//обрабатывает полученную от клиента JSON-строку и преобразует ее в ассоциативный массив
	public function handleContent($content) {
		if ( is_null($content) || is_null($arr = json_decode($content)) ) {
            http_response_code(400);
			header("HTTP/1.1 400 Bad Request");
			header('Status: 400 Bad Request');
			file_put_contents(CLIENT_ERROR, "Класс: ".get_class($this).", метод: ".__FUNCTION__.". Передан неверный параметр json_string: ".$content." \n", FILE_APPEND | LOCK_EX | FILE_USE_INCLUDE_PATH);			
			die();
		}
		return $arr;
	}
	//проверяет авторизован ли пользователь
	public function getUserID() {
		//метод определен в трейте DataBase
		$this->userAuthorized();
		if	(empty($this->user_id)){
			$this->setFieldError("Email", "Пользователь не авторизован");
			return;				
		}
		//если пользователь авторизован, сохраним для ответа клиенту user_id пользователя 
		$this->status = "ok";
		$this->data = $this->user_id;		
	}	
	
	//получает параметр из запроса
    public function getRequestParam($name)
    {
        //если в $_REQUEST есть элемент с ключом name (например, username, password1, password2) 
		if (array_key_exists($name, $this->request)) {
			//то вернем его значение
            return trim($this->request[$name]);
        }
        return null;			
    }

	//используется для формирования ответа клиенту 
    public function setResponse($key, $value)
    {
        $this->data[$key] = $value;
    }

	//инициализирует свойства дли ответа клиенту параметрами ошибки
    public function setFieldError($name, $message = "")
    {
        $this->status = "err";
        $this->code = $name;
        $this->message = $message;
    }

	//превращает переменные в JSON-строку
    public function renderToString()
    {
        $this->json = array(
            "status" => $this->status,
            "code" => $this->code,
            "message" => $this->message,
            "data" => $this->data,
        );
		//возвращает JSON-представление данных
		//ENT_NOQUOTES оставляет без изменения как двойные, так и одинарные кавычки.
        return json_encode($this->json, ENT_NOQUOTES);
    }

	//выводит ответ сервера пользователю 
    public function showResponse()
    {
		header("Content-Type: application/json; charset=UTF-8");
        $this->response = $this->renderToString();
		echo $this->response;
    }
	
	//при регистрации на сайте отправляет пользователю письмо с просьбой подтверить e-mail 
	public function sendMail($to, $activation){	
		$subject = "Thank you for registration";
		$message = " Спасибо за регистрацию на сайте a-diary.ru! Для подтверждения регистрации, пожалуйста, перейдите по ссылке: http://".$this->http_host."/index.php?code=".$activation;
		return mail( "$to", "$subject", $message, "From: info@" . $this->http_host );
	}
}

/*Классы, в которых объявлен метод-конструктор, будут вызывать этот метод при каждом создании нового объекта, так что это может оказаться полезным, например, для инициализации какого-либо состояния объекта перед его использованием.
Конструкторы в классах-родителях не вызываются автоматически, если класс-потомок определяет собственный конструктор. Чтобы вызвать конструктор, объявленный в родительском классе, следует обратиться к методу parent::__construct() внутри конструктора класса-потомка. Если в классе-потомке не определен конструктор, то он может наследоваться от родительского класса как обычный метод (если он не определен как приватный).*/
