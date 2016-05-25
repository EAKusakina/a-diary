<?
include_once 'Support/DataBase.trait.php';

class FinishingRegister {
	
	use DataBase;
	
	private $initCategories = array('food', 'activity', 'health', 'other');
	
	public function __construct($request){
		if (!isset($_GET['code']))
			return;
		else {
			$code = strtolower(trim(strip_tags($_GET['code']))); 
			try {
				$this->connectdb();
				$this->user_id = $this->confirmRegister($code);
			} catch (\Exception $e) {
					$text_error = $e->getMessage();
					setcookie("error", $text_error, time()+3600, "/", "", false, true);
					header('Content-Type: text/html; charset=UTF-8');
					header ('Location: http://food.diary/inc/registerError.inc.php');
					return;
			}	
			$this->startSession();
			//присвоили session ранее полученный методом confirmRegister id из бд
			$_SESSION["user_id"] = $this->user_id;
			session_write_close();
			//создали для нового пользователя комплект типовых категорий
			if ($this->createCategories()){
				header('Content-type: text/html; charset=UTF-8');
				header ('Location: http://food.diary/index.php');
			}					
		}	
	}
	
	public function __destruct()
    {
        $this->db = null;
    }

	public function confirmRegister($activation) {
        $query = "SELECT id, status FROM users WHERE activation=:activation";
		$args = array(':activation' => $activation);
		$sth = $this->getData ($query, $args);
		
		if ($row = $sth->fetch()) {
			//генерируем новый код активации для бд, чтобы ссылка, высланная на e-mail, перестала быть рабочей
			$activation = md5($activation.time());
			$query = "UPDATE users SET status='1', activation=:activation  WHERE id=:id";
			$args = array(':activation' => $activation, ':id' => $row["id"]);
			$resultUpd = $this->updTable ($query, $args);
		}
		else 
			throw new \Exception("Неверный код активации. Возможно, Ваш аккаунт уже был активирован ранее, и ссылка для активации устарела. Попробуйте <a href = 'http://food.diary/index.php'>войти на сайт</a>.", 1);		
        return $row['id'];
    }	

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
