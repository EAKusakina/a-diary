<?php
	// для инкапсуляции элементов: функций, классов и т.д.
	include 'Support/AjaxRequest.class.php';
	
	class tmp{};

	class Event extends AjaxRequest 
	{
		//названия функций, одна из которых будет вызвана
		public $actions = array(
			"updEvents" => "updEvents",
		);
			
		public function __construct($request)
		{
			//инициализировали $this->user_id 
			$this->userAuthorized();
			if	(empty($this->user_id)){
				$this->setFieldError("Email", "Пользователь не авторизован");
				return;				
			}
			//подключились к БД 
			$this->connectDb();			
			//вызвали через родительский конструктор нужную функцию 
			parent::__construct($request); 
		}
		/*Деструктор будет вызван при освобождении всех ссылок на определенный объект или при завершении скрипта (порядок выполнения деструкторов не гарантируется).*/
		public function __destruct()
		{
			$this->db = null;
		}
		
		// обновление списка категорий пользователя
		public function updEvents() {
			$content = $this->getRequestParam("json_string");
			// Формат полученной строки: разница_во_времени|массив в виде JSON-объекта. Например: -3|{[...]}
			$pos = strpos($content, '|');
			$timeDifference = substr($content, 0, $pos);
			$content = substr(strstr($content, '|'), 1);
			
			$arr = $this->handleContent($content);
			foreach ($arr as &$value){
				$args = array();
				$action = trim(strip_tags($value->updateType));
				//если присланный элемент был добавлен и сразу удален, то переходим к следующему
				if ($action == 'adddel')
					continue;
				$db_id = abs((int)$value->db_id);
				$user_id = abs((int)$value->user_id);
				$date = date('Y-m-d',strtotime($value->date)+$timeDifference*60);
				$hours = abs((int)$value->hours);
				$minutes = abs((int)$value->minutes);
				//функцию mysql_real_escape_string не надо использовать. Ее использовали, когда текст запроса формируется на php, чтобы вне кавычек ничего не вылезло. А в подготовленном запросе, схема самого запроса уже создана, осталось только данные подставить, т.е. БД знает что это данные, а не код запроса.
				$description = trim(strip_tags($value->description));
				$category = trim(strip_tags($value->category));
				$id_category = abs((int)$value->id_category);
				switch ($action) {
					case 'add':
						$sql = "INSERT INTO all_records (user_id, date, hours, minutes, description, category, id_category) VALUES (:user_id, :date, :hours, :minutes, :description, :category, :id_category)";
						$args = array(':user_id' => $user_id, ':date' => $date, ':hours' => $hours, ':minutes' => $minutes, ':description' => $description, ':category' => $category, ':id_category' => $id_category);	
						$value->db_id = $this->updTable($sql, $args, true);
						break;
					case 'upd':
						$sql = "UPDATE all_records SET date=:date, hours=:hours, minutes=:minutes, description=:description, category=:category, id_category=:id_category WHERE db_id=:db_id";
						$args = array(':db_id' => $db_id, ':date' => $date, ':hours' => $hours, ':minutes' => $minutes, ':description' => $description, ':category' => $category, ':id_category' => $id_category);	
						$this->updTable($sql, $args);
						break;
					case 'del':
						$sql = "DELETE FROM all_records WHERE db_id=:db_id";
						$args = array(':db_id' => $db_id);	
						$this->updTable($sql, $args);
						break;
					case 'upddel':
						$sql = "DELETE FROM all_records WHERE db_id=:db_id";
						$args = array(':db_id' => $db_id);	
						$this->updTable($sql, $args);
						break;
					case 'get':
						$sql = "SELECT db_id, user_id, date, hours, minutes, description, category, id_category FROM all_records WHERE user_id=:user_id";
						$args = array(':user_id' => $user_id);	
						$sth = $this->getData($sql, $args);
						$arr = new tmp;
						$i = 0;
						while ($row = $sth->fetch(PDO::FETCH_ASSOC)){
							$arr->$i = (object)$row;	
							$i++;
						}
						break;
				}								
			}
			$this->status = "ok";
			$this->data = $arr;
		}		
	}		
	$events = new Event($_REQUEST);
	$events->showResponse();		
