<?php

include 'Support/User.class.php';
include 'Support/AjaxRequest.class.php';

// обработчик запросов на авторизацию, регистрацию и выход с сайта
class AuthorizationAjaxRequest extends AjaxRequest
{
	//названия методов, один из которых будет вызван
    public $actions = array(
        "login" => "login",
        "logout" => "logout",
        "register" => "register",
		"getUserID" => "getUserID",
    );
	
	//обеспечивает авторизацию пользователя
    public function login()
    {
		//разбираем полученную от клиента строку-запрос
		$content = $this->getRequestParam("json_string");
		$arr = $this->handleContent($content);
		$username = $arr->username;
        $password = $arr->password;
        $remember = $arr->rememberMe;
		
		//если по каким-то причинам проверки на клиенте отключены, и пришло пустое имя пользователя(e-mail) или пароль вернем ошибку
        if (empty($username)) {
            $this->setFieldError("Email", "Введите E-mail");
            return;
        }

        if (empty($password)) {
            $this->setFieldError("Password", "Введите пароль");
            return;
        }
		
		$user = new User($username, $password);		
		
		try {
			//пробуем авторизовать пользователя
			$auth_result = $user->authorize($remember);
        } catch (ExceptionForUser $e) {
			//исключение на случай, когда пользователь прислал неверные данные (логин и/или пароль)
            $this->setFieldError("Email", $e->getMessage());
            return;
        } catch (Exception $e) {
			//исключение на случай, когда возникли какие-то проблемы не по вине клиента(ошибка сервера, ошибка в коде и т.п.)
			file_put_contents(SERVER_ERROR, "Не удалось авторизовать пользователя: ".$username.", класс: ".get_class($this).", метод: ".__FUNCTION__.", ".$e."\n", FILE_APPEND | LOCK_EX | FILE_USE_INCLUDE_PATH);
			throw new ExceptionForUser("В настоящий момент сервис недоступен. Пожалуйста, попробуйте войти на сайт позднее", 500);
		}
		//когда авторизация прошла успешно отправляем клиенту адрес для редиректа страницы
        $this->status = "ok";
        $this->data = $auth_result;		
        $this->code = "";
    }
	
	//обеспечивает выход пользователя с сайта
    public function logout()
    {	
        $user = new User();
        $user->logout();
		//когда выход с сайта прошел успешно в data отправляем клиенту адрес для редиректа страницы		
        $this->status = "ok";
        $this->code = "../inc/index.inc.php";
    }

	//обеспечивает регистрацию пользователя
    public function register()
    {
         //разбираем полученную от клиента строку-запрос
		$content = $this->getRequestParam("json_string");
		$arr = $this->handleContent($content);
		$username = $arr->username;
        $password = $arr->password;

		//если по каким-то причинам проверки на клиенте отключены, и пришло пустое имя пользователя(e-mail) или пароль вернем ошибку
        if (empty($username)) {
            $this->setFieldError("Email", "Введите e-mail");
            return;
        }

        if (empty($password)) {
            $this->setFieldError("Password", "Введите пароль");
            return;
        }

        $user = new User($username, $password);
		//уникальный код активации, который вставляется в письмо, направляемое пользователю для подтверждения e-mail
		$activation = md5($username.time());
		
        try {
			//пробуем создать нового пользователя в БД
            $new_user_id = $user->create($activation);
        } catch (ExceptionForUser $e) {
			//исключение на случай, когда пользователь прислал неверные данные (такой логин уже зарегистрирован в БД)			
            $this->setFieldError("Email", $e->getMessage());
            return;
        } catch (Exception $e) {
			//исключение на случай, когда возникли какие-то проблемы не по вине клиента(ошибка сервера, ошибка в коде и т.п.)
			file_put_contents(SERVER_ERROR, "Не удалось созадать нового пользователя: ".$username.", класс: ".get_class($this).", метод: ".__FUNCTION__.", ".$e."\n", FILE_APPEND | LOCK_EX | FILE_USE_INCLUDE_PATH);
			throw new ExceptionForUser("В настоящий момент регистрация новых пользователей не осуществляется. Пожалуйста, попробуйте зарегистрироваться позднее", 500);
		}		
		$to = 'torysk@mail.ru';
		
		//если не удалось отправить пользователю письмо для подтверждения e-mail
		if (!$this->sendMail($to, $activation)){
			file_put_contents(SERVER_ERROR, "Ошибка при отправке пользователю ".$to.", код активации ".$activation." письма с подтверждением регистрации на сайте \n", FILE_APPEND | LOCK_EX | FILE_USE_INCLUDE_PATH);
		}
		//когда первый этап регистрации прошел успешно в data отправляем клиенту адрес для редиректа страницы
		$this->status = "ok";		
		$this->code = "../inc/thanksForRegister.inc.php";		
    }
}
//т.к. своего конструктора у AuthorizationAjaxRequest нет, используется конктруктор класса-родителя (AjaxRequest в файле AjaxRequest.class.php)
$ajaxRequest = new AuthorizationAjaxRequest($_REQUEST);
//отправка ответа клиенту
$ajaxRequest->showResponse();

/*Псевдо-переменная $this доступна в том случае, если метод был вызван в контексте объекта. $this является ссылкой на вызываемый объект. Обычно это тот объект, которому принадлежит вызванный метод, но может быть и другой объект, если метод был вызван статически из контекста другого объекта. */
