<?
include_once 'Support/DataBase.trait.php';

//обработчик для завершения регистрации на сайте (срабатывает, когда пользователь переходит по ссылке в письме для подтверждения email)
class FinishingRegister {
	
	//использует трейт, в котором определены методы для работы с сессиями и БД	
	use DataBase;
	
	//массив с набором категорий, которые первоначально создаются для пользователя
	private $initCategories = array('food', 'activity', 'health', 'other');
	
	public function __construct($request){
		//если запрос не методом GET - выходим
		if (!isset($_GET['code']))
			return;
		else {
			//используется для формирования ссылок
			$this->http_host = $_SERVER['HTTP_HOST'];
			//если не определен или пуст, присвоим наиболее вероятное значение
			if (is_null($this->http_host) || empty ($this->http_host))
				$this->http_host = "a-diary.ru"; 
			//получили уникальный код (сохранен в БД при создании пользователя)
			$code = strtolower(trim(strip_tags($_GET['code']))); 
			try {
				//подключились к БД (метод определен в трейте DataBase)
				$this->connectdb();
				//получили user_id, если подтверждение регистрации прошло успешно
				$this->user_id = $this->confirmRegister($code);
			} catch (\Exception $e) {//иначе переадресуем пользователя на страницу с ошибкой
					$text_error = $e->getMessage();
					setcookie("error", $text_error, time()+3600, "/", "", false, true);
					header('Content-Type: text/html; charset=UTF-8');
					header ('Location: http://'.$this->http_host.'/inc/registerError.inc.php');
					return;
			}
			//метод определен в трейте DataBase			
			$this->startSession();
			//записали в сессионную переменную user_id из БД
			$_SESSION["user_id"] = $this->user_id;
			session_write_close();
			//создали для нового пользователя комплект типовых категорий
			if ($this->createCategories()){
				//и переадресовали его на главную страницу сайта
				header('Content-type: text/html; charset=UTF-8');
				header ('Location: http://'.$this->http_host.'/index.php');
			}					
		}	
	}
	
	public function __destruct()
    {
        $this->db = null;
    }
	
	//вносит изменения в БД, показывающие, что email пользователя успешно подтвержден
	public function confirmRegister($activation) {
        $query = "SELECT id, status FROM users WHERE activation=:activation";
		$args = array(':activation' => $activation);
		//метод определен в трейте DataBase			
		$sth = $this->getData ($query, $args);
		//если все успешно получили
		if ($row = $sth->fetch()) {
			//генерируем новый код активации для БД, чтобы ссылка, высланная на e-mail, перестала быть рабочей
			$activation = md5($activation.time());
			//обновляем код активации и статус в БД (0 - email не подтвержден, 1 - email подтвержден)
			$query = "UPDATE users SET status='1', activation=:activation  WHERE id=:id";
			$args = array(':activation' => $activation, ':id' => $row["id"]);
			//метод определен в трейте DataBase			
			$resultUpd = $this->updTable ($query, $args);
		}
		else 
			throw new \Exception("Неверный код активации. Возможно, Ваш аккаунт уже был активирован ранее, и ссылка для активации устарела. Попробуйте <a href = 'http://".$this->http_host."/index.php'>войти на сайт</a>.", 1);		
		//возвращаем user_id полученный из БД
        return $row['id'];
    }	
	
	//создает в БД типовой список категорий для нового пользователя
    public function createCategories() {		
		$sql = "INSERT INTO all_categories (user_id, category, selected) VALUES ";
		$args = array();
		foreach ($this->initCategories as $category){
			$sql = $sql . '(?, ?, ?),';
			$args[] = $this->user_id; 
			$args[] = $category;
			if ($category == 'food')
				$args[] = 1;
			else
				$args[] = 0;
		} 
		//удаляем последнюю лишнюю запятую
		$sql = rtrim($sql, ','); 			
		$result = $this->updTable($sql, $args);
        return $result;
    }			
}

$obj = new FinishingRegister($_REQUEST);
