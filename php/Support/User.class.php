<?php

include_once 'DataBase.trait.php';

class User
{
	use DataBase;

    private $username;
    private $password;

    private $is_authorized = false;

	/*Классы, в которых объявлен метод-конструктор, будут вызывать этот метод при каждом создании нового объекта, так что это может оказаться полезным, например, для инициализации какого-либо состояния объекта перед его использованием.
	Конструкторы в классах-родителях не вызываются автоматически, если класс-потомок определяет собственный конструктор. Чтобы вызвать конструктор, объявленный в родительском классе, следует обратиться к методу parent::__construct() внутри конструктора класса-потомка. Если в классе-потомке не определен конструктор, то он может наследоваться от родительского класса как обычный метод (если он не определен как приватный).*/
	
    public function __construct($username = null, $password = null) {
        $this->username = $username;
        $this->password = $password;
    }
	/*Деструктор будет вызван при освобождении всех ссылок на определенный объект или при завершении скрипта (порядок выполнения деструкторов не гарантируется).*/
    public function __destruct() {
        $this->db = null;
    }
		
	//получение хеша пароля и соли 
    public function passwordHash($salt = null, $iterations = 10)
    {
        //uniqid Возвращает уникальный идентификатор в виде строки (string).
		$salt || $salt = uniqid();
        $hash = md5(md5($this->password . md5(sha1($salt))));

        for ($i = 0; $i < $iterations; ++$i) {
            $hash = md5(md5(sha1($hash)));
        }

        return array('hash' => $hash, 'salt' => $salt);
    }
	// получение соли из бд
    public function getSalt() {
        $sql = "SELECT salt FROM users WHERE username = :username LIMIT 1";
        $args = array(":username" => $this->username);
		$sth = $this->getData($sql, $args);
		//fetch - выдает следующую строку результирующего набора
        $row = $sth->fetch();
        if (!$row) {
            return false;
        }
        return $row["salt"];
    }

    // проверяем правильность ввода логина и пароля
	public function authorize($remember=false)
    {
        $this->connectdb();
        //проверяем существование пользователя, пытаясь выбрать его соль из базы
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
		//и делаем выборку из базы, используя логин и хеш
		$sth = $this->getData($sql, $args);

		//тут сохранили результат выполнения запроса к бд
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

        return $this->is_authorized;
    }
	//очистили элемент массива session
    public function logout()
    {
		// Initialize the session.
		// If you are using session_name("something"), don't forget it now!
        $this->startSession();
		// Unset all of the session variables.
		$_SESSION = array();
		
		// If it's desired to kill the session, also delete the session cookie.
		// Note: This will destroy the session, and not just the session data!
		if (ini_get("session.use_cookies")) {
			$params = session_get_cookie_params();
			setcookie(session_name(), '', time() - 42000,
				$params["path"], $params["domain"],
				$params["secure"], $params["httponly"]
			);
		}

		// Finally, destroy the session.
		session_destroy();				
		//убивать куки нужно также, как созавать: если создали через задание всех параметров, то и удалять также (просто setcookie ("sid", "", time()-3600); не работает) 
		$cookie = setcookie("sid", "", time()-3600, "/", "", false, true);
    }

    public function saveSession($remember = false, $http_only = true, $days = 7)
    {
        $this->startSession();
		//присвоили session ранее полученное значение id из бд
		$_SESSION["user_id"] = $this->user_id;
		//если пользователь поставил галку, чтобы его запомнили
		if ($remember) {
			// Save session id in cookies
//            $sid = session_id();//получает и/или устанавливает текущий id сессии 
			$sid = $_SESSION["user_id"];//получает и/или устанавливает текущий id сессии 

			$expire = time() + $days *24 * 3600;//срок хранения куки
			$domain = ""; // default domain
			$secure = false;//Указывает на то, что значение cookie должно передаваться от клиента по защищенному HTTPS соединению. Если задано TRUE, cookie от клиента будет передано на сервер, только если установлено защищенное соединение.
			$path = "/";//Путь к директории на сервере, из которой будут доступны cookie
			/*setcookie() задает cookie, которое будет передано клиенту вместе с другими HTTP заголовками. Как и любой другой заголовок, cookie должны передаваться до того как будут выведены какие-либо другие данные скрипта (это ограничение протокола). Это значит, что в скрипте вызовы этой функции должны располагаться прежде остального вывода, включая вывод тэгов <html> и <head>, а также пустые строки и пробелы.
			После передачи клиенту cookie станут доступны через массивы $_COOKIE и $HTTP_COOKIE_VARS при следующей загрузке страницы. 
			http_only - Если задано TRUE, cookie будут доступны только через HTTP протокол. То есть cookie в этом случае не будут доступны скриптовым языкам, вроде JavaScript. 
			*/
			$cookie = setcookie("sid", $sid, $expire, $path, $domain, $secure, true);
		}
		session_write_close();			
    }
	/*Если пользователь был усшешно создан, функция User::create() возвращает его уникальный идентификатор. Это обычное числовое поле, которое автоматически увеличивается при добавлении записей в таблицу.*/
    public function create($activation) {
        $this->connectdb();
        $user_exists = $this->getSalt();
		/* Исключение можно сгенерировать (как говорят, "выбросить") при помощи оператора throw, и можно перехватить (или, как говорят, "поймать") оператором catch. Код генерирующий исключение, должен быть окружен блоком try, для того чтобы можно было перехватить исключение. Каждый блок try должен иметь как минимум один соответствующий ему блок catch или finally.
		У нас вызов create обрамлен блоком try, за которым следует блок catch */
        if ($user_exists) {
            throw new ExceptionForUser("Пользователь с e-mail '".$this->username."' уже существует. Пожалуйста, используйте другой e-mail", "userDataError");
        }

        $sql = "INSERT INTO users (username, password, salt, activation, status)
            VALUES (:username, :password, :salt, :activation, :status)";
        $hashes = $this->passwordHash();
		$args = array(
                    ':username' => $this->username,
                    ':password' => $hashes['hash'],
                    ':salt' => $hashes['salt'],
                    ':activation' => $activation,
                    ':status' => 0,					
                );
		$result = $this->updTable($sql, $args);
        return $result;
    }

}