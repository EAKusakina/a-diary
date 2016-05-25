<?php

include 'Support/User.class.php';
include 'Support/AjaxRequest.class.php';

// Используем HTTP-only cookie для хранения идентификатора сессии, чтобы защититься от кражи идентификатора сессии с помощью js
//session_set_cookie_params(0, '/', '', false, true);

//session_start() создаёт сессию (или продолжает текущую на основе session id, переданного через GET-переменную или куку).
//session_start();

/*Псевдо-переменная $this доступна в том случае, если метод был вызван в контексте объекта. $this является ссылкой на вызываемый объект. Обычно это тот объект, которому принадлежит вызванный метод, но может быть и другой объект, если метод был вызван статически из контекста другого объекта. */


// Здесь происходит непосредственная обработка запросов через класс AjaxRequest.
// extends показывает, что AuthorizationAjaxRequest - это потомок AjaxRequest
class AuthorizationAjaxRequest extends AjaxRequest
{

	//названия функций, одна из которых будет вызвана
    public $actions = array(
        "login" => "login",
        "logout" => "logout",
        "register" => "register",
		"getUserID" => "getUserID",
    );
	
    public function login()
    {
        $content = $this->getRequestParam("json_string");
		$arr = $this->handleContent($content);
		$username = $arr->username;
        $password = $arr->password;
        $remember = $arr->rememberMe;

        if (empty($username)) {
            $this->setFieldError("Email", "Enter the username");
            return;
        }

        if (empty($password)) {
            $this->setFieldError("Password", "Enter the password");
            return;
        }

		$user = new User($username, $password);		
		
		try {
			$auth_result = $user->authorize($remember);
        } catch (ExceptionForUser $e) {
            $this->setFieldError("Email", $e->getMessage());
            return;
        } catch (Exception $e) {
			file_put_contents(SERVER_ERROR, "Не удалось авторизовать пользователя: ".$username.", класс: ".get_class($this).", функция: ".__FUNCTION__.", ".$e."\n", FILE_APPEND | LOCK_EX | FILE_USE_INCLUDE_PATH);
			throw new ExceptionForUser("В настоящий момент сервис недоступен. Пожалуйста, попробуйте войти на сайт позднее", 500);
//			return;		
		}		
        $this->status = "ok";
        $this->data = "";
    }

    public function logout()
    {	
        $user = new User();
        $user->logout();
        $this->status = "ok";
        $this->data = "../inc/index.inc.php";
    }

    public function register()
    {
        $content = $this->getRequestParam("json_string");
		$arr = $this->handleContent($content);

		$username = $arr->username;
        $password = $arr->password;

        if (empty($username)) {
            $this->setFieldError("Email", "Enter the username");
            return;
        }

        if (empty($password)) {
            $this->setFieldError("Password", "Enter the password");
            return;
        }

        $user = new User($username, $password);
		$activation = md5($username.time()); // encrypted email+timestamp
		
        try {
            $new_user_id = $user->create($activation);
        } catch (ExceptionForUser $e) {
            $this->setFieldError("Email", $e->getMessage());
            return;
        } catch (Exception $e) {
			file_put_contents(SERVER_ERROR, "Не удалось созадать нового пользователя: ".$username.", класс: ".get_class($this).", функция: ".__FUNCTION__.", ".$e."\n", FILE_APPEND | LOCK_EX | FILE_USE_INCLUDE_PATH);
			throw new ExceptionForUser("В настоящий момент регистрация новых пользователей не осуществляется. Пожалуйста, попробуйте зарегистрироваться позднее", 500);
//			return;		
		}		
		$to = 'torysk@mail.ru';
		if (!$this->sendMail($to, $activation)){
			//если не удалось передать письмо с подтверждением на отправку
			file_put_contents(SERVER_ERROR, "Ошибка при отправке пользователю ".$to.", код активации ".$activation." письма с подтверждением регистрации на сайте \n", FILE_APPEND | LOCK_EX | FILE_USE_INCLUDE_PATH);
		}			
		$this->status = "ok";		
		$this->data = "../inc/thanksForRegister.inc.php";		
    }
}

$ajaxRequest = new AuthorizationAjaxRequest($_REQUEST);
$ajaxRequest->showResponse();