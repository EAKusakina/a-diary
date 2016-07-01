<?php

include_once 'DataBase.trait.php';

//Содержит методы для регистрации, авторизации пользователя (в том числе для шифрования пароля, создания и проверки "соли") и выхода с сайта, работающие непосредственно с БД
class User
{
	//использует трейт, в котором определены методы для работы с сессиями и БД
	use DataBase;
	
	//имя пользователя и пароль
    private $username;
    private $password;

    private $is_authorized = false;
	
	//конструктор класса
    public function __construct($username = null, $password = null) {
        $this->username = $username;
        $this->password = $password;
    }
	//деструктор вызывается при освобождении всех ссылок на определенный объект или при завершении скрипта (порядок выполнения деструкторов не гарантируется).
    public function __destruct() {
        $this->db = null;
    }
		
	//создает хеш пароля и, опционально, соль 
    public function passwordHash($salt = null, $iterations = 10)
    {
        //uniqid возвращает уникальный идентификатор в виде строки (если соль не прислали в виде аргумента - создадим ее с помощью uniqid)
		$salt || $salt = uniqid();
        $hash = md5(md5($this->password . md5(sha1($salt))));

        for ($i = 0; $i < $iterations; ++$i) {
            $hash = md5(md5(sha1($hash)));
        }

        return array('hash' => $hash, 'salt' => $salt);
    }
	
	// получает соль из БД
    public function getSalt() {
        $sql = "SELECT salt FROM users WHERE username = :username LIMIT 1";
        $args = array(":username" => $this->username);
		//метод определен в трейте DataBase
		$sth = $this->getData($sql, $args);
		//fetch - выдает следующую строку результирующего набора
        $row = $sth->fetch();
        if (!$row) {
            return false;
        }
        return $row["salt"];
    }

    // проверяет правильность логина и пароля
	public function authorize($remember=false)
    {
		//метод определен в трейте DataBase
        $this->connectdb();
        //проверяем существование пользователя, пытаясь выбрать его соль из БД
		$salt = $this->getSalt();
		//если пользователь не найден
        if (!$salt) {
            throw new ExceptionForUser("Неверное имя пользователя или пароль", "userDataError");
        }
		//иначе хешируем полученный пароль выбранной из БД солью
        $hashes = $this->passwordHash($salt);
        
        $sql = "SELECT id, username, status FROM users WHERE
            username = :username AND password = :password LIMIT 1";
        $args = array(":username" => $this->username, ":password" => $hashes['hash']);
		//и делаем выборку из БД, используя логин и хеш
		$sth = $this->getData($sql, $args);

		//сохраняем результат выполнения запроса к БД
        $this->user = $sth->fetch();
		//если пользователь не найден (результат запроса пустой) - авторизация не пройдена
        if (!$this->user) {
            throw new ExceptionForUser("Неверное имя пользователя или пароль", "userDataError");
        }
		//если пользователь не подтвердил эл. почту после регистрации - авторизация не пройдена
        if ($this->user['status']==0) {
            throw new ExceptionForUser("Пожалуйста, подтвердите Вашу электронную почту, перейдя по ссылке в письме, которое мы отправили на Ваш e-mail: ".$this->username, "userDataError");
        }
        $this->is_authorized = true;
        $this->user_id = $this->user['id'];
		/* Записываем id пользователя в сессию. Если в качестве первого аргумента — $remember, передать ей true, то идентификатор сессии сохранится в куках. Это позволит не вводить пароль каждый раз при перезапуске браузера.*/
        $this->saveSession($remember);

        return $this->user_id;
    }
	
	// очищает и уничножает сессионные переменные/куки, чтобы пользователь мог выйти с сайта
    public function logout()
    {
		//метод определен в трейте DataBase
        $this->startSession();
		
		// очищаем массив $_SESSION, тем самым уничножая сессионные переменные
		$_SESSION = array();
		
		// уничтожаем сессионные куки
		if (ini_get("session.use_cookies")) {
			$params = session_get_cookie_params();
			setcookie(session_name(), session_id(), time() - 42000,
				$params["path"], $params["domain"],
				$params["secure"], $params["httponly"]
			);
		}

		// уничтожаем сессию
		session_destroy();				
		//уничтожаем куку, хранящую информацию о необходимости запомнить имя пользователя и пароль
		//уничтожать куки нужно также, как они создавались: если создали через задание всех параметров, то и удалять также (просто setcookie ("sid", "", time()-3600); не работает) 
		$cookie = setcookie("sid", "", time()-3600, "/", "", false, true);
    }

	//создает сессионную переменную и куку, отвечающие за то, чтобы сайт "помнил" пользователя  
    public function saveSession($remember = false, $http_only = true, $days = 7)
    {
		//метод определен в трейте DataBase
		$this->startSession();
		//присвоили ранее полученное значение id из БД; данная сессионная переменная будет жить пока есть сессия (т.е. до закрытия браузера)
		$_SESSION["user_id"] = $this->user_id;
		//если пользователь поставил галку, чтобы его запомнили, создадим куку, которая будет хранить user_id 7 дней 
		if ($remember) {
			$sid = $_SESSION["user_id"]; 
			$expire = time() + $days *24 * 3600;//срок хранения куки
			$domain = ""; // домен по умолчанию
			$secure = false;//Указывает на то, что значение cookie должно передаваться от клиента по защищенному HTTPS соединению. Если задано TRUE, cookie от клиента будет передано на сервер, только если установлено защищенное соединение.
			$path = "/";//Путь к директории на сервере, из которой будут доступны cookie
			/*setcookie() задает cookie, которое будет передано клиенту вместе с другими HTTP заголовками. Как и любой другой заголовок, cookie должны передаваться до того как будут выведены какие-либо другие данные скрипта (это ограничение протокола). Это значит, что в скрипте вызовы этой функции должны располагаться прежде остального вывода, включая вывод тэгов <html> и <head>, а также пустые строки и пробелы.
			После передачи клиенту cookie станут доступны через массивы $_COOKIE и $HTTP_COOKIE_VARS при следующей загрузке страницы. 
			http_only - Если задано TRUE, cookie будут доступны только через HTTP протокол. То есть cookie в этом случае не будут доступны скриптовым языкам, вроде JavaScript.*/
			$cookie = setcookie("sid", $sid, $expire, $path, $domain, $secure, true);
		}
		//сохраняем сессионные данные и закрываем сессию
		session_write_close();			
    }
	
	//создает нового пользователя в БД
    public function create($activation) {
        $this->connectdb();
        $user_exists = $this->getSalt();
		//если пользователь уже существует (в БД есть соответствующая соль)
        if ($user_exists) {
            throw new ExceptionForUser("Пользователь с e-mail '".$this->username."' уже существует. Пожалуйста, используйте другой e-mail", "userDataError");
        }
		//создаем нового пользователя в БД
        $sql = "INSERT INTO users (username, password, salt, activation, status)
            VALUES (:username, :password, :salt, :activation, :status)";
        $hashes = $this->passwordHash();
		$args = array(
                    ':username' => $this->username,
                    ':password' => $hashes['hash'],//храним пароль в зашифрованном виде
                    ':salt' => $hashes['salt'],
                    ':activation' => $activation,//код активации, направляемый в письме для подтверждения e-mail (после подтверждения будет изменен)
                    ':status' => 0,	//(0 - email не подтвержден, 1 - подтвержден)				
                );
		//метод определен в трейте DataBase
		$result = $this->updTable($sql, $args);
        return $result;
    }
}
/* Исключение можно сгенерировать (как говорят, "выбросить") при помощи оператора throw, и можно перехватить (или, как говорят, "поймать") оператором catch. Код генерирующий исключение, должен быть окружен блоком try, для того чтобы можно было перехватить исключение. Каждый блок try должен иметь как минимум один соответствующий ему блок catch или finally.*/
