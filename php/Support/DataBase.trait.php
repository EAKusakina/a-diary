<?php
include_once 'ErrorsAndExceptions.php';//файл для обработки ошибок и исключений ExceptionForUser

	//работает с базой данных (БД) и сессией
	trait DataBase
	{
		//свойство для доступа к БД
		protected $db;
		//уникальный id пользователя в БД
		protected $user_id;
		//нужен в классах, использующих трейт, для формирования ссылок
		protected $http_host;

		//параметры для доступа к БД
		private $db_host;
		private $db_name;
		private $db_user;
		private $db_pass;
		private $db_charset = "UTF8";

		//запускает/возобновляет сессию
		public function startSession() {
			//время жизни уникального идентификатора сессии session_id
			$idLifetime = 60;
			session_set_cookie_params(0, '/', '', false, true);
			ini_set('session.cookie_lifetime', 0);
			//session_start() создаёт сессию (или продолжает текущую на основе session id, переданного через GET-переменную или куку).
			//если не удалось запустить сессию из-за ошибки сервера
			if ( ! session_start() ){
				/*Функция sessionStart может вернуть FALSE в двух случаях. Либо сессию не удалось запустить из-за каких-то внутренних ошибок сервера (например, неправильные настройки сессий в php.ini), либо время жизни сессии истекло. В первом случае мы должны перебросить пользователя на страницу с ошибкой о том, что есть проблемы на сервере, и формой обращения в службу поддержки. Во втором случае мы должны перевести пользователя на форму входа и вывести в ней соответствующее сообщение о том, что время сессии истекло. Для этого нам необходимо ввести коды ошибок и возвращать вместо FALSE соответствующий код, а в вызывающем методе проверять его и действовать соответствующим образом.*/
				file_put_contents(SERVER_ERROR, "Не удалось запустить/возобновить сессию, класс: ".get_class($this).", метод: ".__FUNCTION__." \n", FILE_APPEND | LOCK_EX | FILE_USE_INCLUDE_PATH);
				throw new ExceptionForUser("Технические неполадки на сервере. Пожалуйста, попробуйте повторить операцию позднее", 503);
			}
			//получили текущее время
			$t = time();
			//если задано ограничение на время жизни уникального идентификатора
			if ( $idLifetime) {
					//и определена сессионная переменная $_SESSION['starttime']
					if ( isset($_SESSION['starttime']) ) {
						//если с момента последней генерации session_id прошло больше, чем $idLifetime времени
						if ( $t-$_SESSION['starttime'] >= $idLifetime ) {
							//сгенерируем новый session_id (регенерация нужна для безопасности)
							session_regenerate_id(true);
							$_SESSION['starttime'] = $t;
						}
					}//присвоим $_SESSION['starttime'] текущее время
					else {
						$_SESSION['starttime'] = $t;
					}
				}
			return true;
		}

		//проверяет, авторизован ли пользователь
		public function userAuthorized (){
			$this->startSession();
			//пробует получить user_id (если user_id будет пуст, значит, пользователь не авторизован)
			$this->user_id = (isset($_SESSION["user_id"]))? $_SESSION["user_id"] : $_COOKIE['sid'];	
			session_write_close();
		}

		//выполняет запрос на добавление, изменение, удаление записи таблицы
		protected function updTable ($query, $args, $add = false) {
			try {
				$sthUpd = $this->db->prepare($query);
				/*beginTransaction — инициализация транзакции.
				Выключает режим автоматической фиксации транзакции. В то время, как режим автоматической фиксации выключен, изменения, внесенные в базу данных через объект экземпляра PDO, не применяются, пока вы не завершите транзакцию, вызвав PDO::commit(). Вызов PDO::rollBack() откатит все изменения в базе данных и вернет соединение к режиму автоматической фиксации.*/
				$this->db->beginTransaction();
				//execute должна возвращать true (если удачно записали/удалили/отредактировали запись в БД) или false, если произошла ошибка
				$resultUpd = $sthUpd->execute($args);
				//получили последний созданный в БД уникальный идентификатор записи
				$newID = $this->db->lastInsertId();
				//commit фиксирует транзакцию, возвращая соединение с базой данных в режим автоматической фиксации до тех пор, пока следующий вызов PDO::beginTransaction() не начнет новую транзакцию.
				$this->db->commit();
			} catch (PDOException $e) {
				try {
					//Откатывает изменения в базе данных сделанные в рамках текущей транзакции, которая была создана методом PDO::beginTransaction(). Если активной транзакции нет, будет выброшено исключение PDOException.
					$this->db->rollBack();
				}
				catch (PDOException $e1) {
					file_put_contents(SERVER_ERROR, "Не удалось откатить неудачную транзакцию запроса: ".$query." с аргументами: ".implode(",", $args).", класс: ".get_class($this).", метод: ".__FUNCTION__.", ".$e1."\n", FILE_APPEND | LOCK_EX);
					throw new ExceptionForUser("Операция завершилась с ошибкой. Пожалуйста, попробуйте повторить операцию позднее", 503);
				}
				file_put_contents(SERVER_ERROR, "Не удалось выполнить запрос: ".$query." с аргументами: ".implode(",", $args).", класс: ".get_class($this).", метод: ".__FUNCTION__.", ".$e."\n", FILE_APPEND | LOCK_EX | FILE_USE_INCLUDE_PATH);
				throw new ExceptionForUser("Не удалось выполнить операцию. Пожалуйста, попробуйте повторить операцию позднее", 503);
			}
			//если это был запрос на добавление новой записи в таблицу
			if ($add)
				//вернем уникальный идентификатор записи
				return $newID;
			else
				return $resultUpd;
		}

		//выполняет запрос на выборку данных из таблицы
		protected function getData ($query, $args) {
			try {
				$sth = $this->db->prepare($query);
				$sth->execute($args);
			} catch (PDOException $e) {
				file_put_contents(SERVER_ERROR, "Не удалось выполнить запрос: ".$query." с аргументами: ".implode(",", $args).", класс: ".get_class($this).", метод: ".__FUNCTION__.", ".$e."\n", FILE_APPEND | LOCK_EX | FILE_USE_INCLUDE_PATH);
				throw new ExceptionForUser("Не удалось выполнить операцию. Пожалуйста, попробуйте повторить операцию позднее", 503);
			}
			return $sth;
		}

		//выполяет подключение к БД
		protected function connectdb(){
			//получаем значения для параметров доступа к БД
			$accessToDB = file_get_contents('accessToDB.txt', FILE_USE_INCLUDE_PATH);
			$pieces = explode(",", $accessToDB);
			$this->db_host = $pieces[0];
			$this->db_name = $pieces[1];
			$this->db_user = $pieces[2];
			$this->db_pass = $pieces[3];

			// в $dsn задается тип БД, с которым будем работать (mysql), хост, имя базы данных и чарсет
			$dsn = "mysql:host=$this->db_host;dbname=$this->db_name;charset=$this->db_charset";
			$opt = array(
			/*"Помимо задания кода ошибки PDO будет выбрасывать исключение PDOException, свойства которого будут отражать код ошибки и ее описание. Этот режим также полезен при отладке, так как сразу известно, где в программе произошла ошибка. Это позволяет быстро локализовать и решить проблему. (Не забывайте, что если исключение является причиной завершения работы скрипта, все активные транзакции будут откачены.)"*/
				PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
				PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
			);
			try {
				//подключаемся к БД
				$this->db = new PDO($dsn,$this->db_user, $this->db_pass, $opt);
			} catch (Exception $e) {
				file_put_contents(SERVER_ERROR, "Не удалось установить соединение с базой данных: ".$e."\n", FILE_APPEND | LOCK_EX | FILE_USE_INCLUDE_PATH);
				throw new ExceptionForUser("Не удалось установить соединение с базой данных. Пожалуйста, попробуйте повторить операцию позднее.", 500);
			}
		}

	}
