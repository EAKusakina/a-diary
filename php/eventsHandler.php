<?php
	include 'Support/AjaxRequest.class.php';
	//вспомогательный класс длЯ созданиЯ объектов
	class tmp{};
	
	//обработчик длЯ добавлениЯ, изменениЯ, удалениЯ событий, а также длЯ получениЯ событий пользователЯ из Ѓ„
	class Event extends AjaxRequest 
	{
		//названиЯ методов, один из которых будет вызван
		public $actions = array(
			"updEvents" => "updEvents",
		);
			
		public function __construct($request)
		{
			//подключились к Ѓ„ 
			$this->connectDb();			
			//вызвали через родительский конструктор нужный метод
			parent::__construct($request); 
		}
		/*деструктор будет вызван при освобождении всех ссылок на определенный объект или при завершении скрипта (порЯдок выполнениЯ деструкторов не гарантируетсЯ).*/
		public function __destruct()
		{
			$this->db = null;
		}
		
		// обновлЯет список событий пользователЯ
		public function updEvents() {
			//разбираем полученную от клиента строку-запрос (методы определены в родительском классе AjaxRequest)
			$content = $this->getRequestParam("json_string");
			// ”ормат получаемой строки: разница_во_времени|объект в формате JSON. Ќапример: -3|{"t":{"updateType":"delAll","user_id":"84"}}
			$pos = strpos($content, '|');
			$timeDifference = substr($content, 0, $pos);
			$content = substr(strstr($content, '|'), 1);
			$arr = $this->handleContent($content);
			
			//каждый элемент массива содержит информацию либо об изменном событии либо о необходимости получить список событий из Ѓ„
			foreach ($arr as &$value){
				$args = array();
				//определЯет какой case в switch ниже будет выполнЯтьсЯ
				$action = trim(strip_tags($value->updateType));
				//если событие добавлено и сразу удалено, то переходим к следующему
				if ($action == 'adddel')
					continue;
				//обрабатываем свойства элемента массива 
				$db_id = abs((int)$value->db_id);
				$user_id = abs((int)$value->user_id);
				$date = date('Y-m-d',strtotime($value->date)+$timeDifference*60);
				$hours = abs((int)$value->hours);
				$minutes = abs((int)$value->minutes);
				//‡десь функцию mysql_real_escape_string длЯ текста (в description находитсЯ описание событиЯ) не надо использовать. …е использовали, когда текст запроса формируетсЯ на php, чтобы вне кавычек не вылезло ничего лишнего. Ђ в подготовленном запросе схема самого запроса уже создана, осталось только данные подставить, т.е. Ѓ„ знает что это данные, а не код запроса.
				$description = trim(strip_tags($value->description));
				$category = trim(strip_tags($value->category));
				$id_category = abs((int)$value->id_category);
				switch ($action) {
					case 'add'://добавление событиЯ
						$sql = "INSERT INTO all_records (user_id, date, hours, minutes, description, category, id_category) VALUES (:user_id, :date, :hours, :minutes, :description, :category, :id_category)";
						$args = array(':user_id' => $user_id, ':date' => $date, ':hours' => $hours, ':minutes' => $minutes, ':description' => $description, ':category' => $category, ':id_category' => $id_category);
						//метод определен в трейте DataBase (подключаетсЯ в родительском классе AjaxRequest)
						$value->db_id = $this->updTable($sql, $args, true);
						break;
					case 'upd'://изменение событиЯ
						$sql = "UPDATE all_records SET date=:date, hours=:hours, minutes=:minutes, description=:description, category=:category, id_category=:id_category WHERE db_id=:db_id";
						$args = array(':db_id' => $db_id, ':date' => $date, ':hours' => $hours, ':minutes' => $minutes, ':description' => $description, ':category' => $category, ':id_category' => $id_category);	
						$this->updTable($sql, $args);
						break;
					case 'del'://удаление событиЯ
					case 'upddel'://именение и удаление событиЯ
						$sql = "DELETE FROM all_records WHERE db_id=:db_id";
						$args = array(':db_id' => $db_id);	
						$this->updTable($sql, $args);
						break;
					case 'delAll'://удаление всех событий пользователЯ
						$sql = "DELETE FROM all_records WHERE user_id=:user_id";
						$args = array(':user_id' => $user_id);	
						$this->updTable($sql, $args);
						break;					
					case 'get'://получение событий за определенную дату
						$sql = "SELECT db_id, user_id, date, hours, minutes, description, category, id_category FROM all_records WHERE user_id=:user_id AND date=:date";
						$args = array(':user_id' => $user_id, ':date' => $date);
						//убрала break, чтобы вполнение case-ов шло подрЯд т.к. обработка полученных из Ѓ„ данных у get и getAll одинаковаЯ 
					case 'getAll'://получение событий за все даты
						//если $sql не определена или пуста (т.е. в запросе getAll)
						if (!isset($sql) || empty($sql)) {
							$sql = "SELECT db_id, user_id, date, hours, minutes, description, category, id_category FROM all_records WHERE user_id=:user_id";
							$args = array(':user_id' => $user_id);
						}
						//метод определен в трейте DataBase (подключаетсЯ в родительском классе AjaxRequest)
						$sth = $this->getData($sql, $args);
						$arr = new tmp;
						$i = 0;
						while ($row = $sth->fetch(PDO::FETCH_ASSOC)){
							//полученную из Ѓ„ дату преобразуем в  формат стандарта ISO 8601, иначе не все браузеры на стороне клиента ее поймут(Chrome поймет, IE и FireFox - нет)
							$row['date'] = date_create($row['date']);
							$row['date'] = date_format($row['date'], 'c');
							$arr->$i = (object)$row;	
							$i++;
						}
						break;
				}								
			}
			//свойства длЯ формированиЯ ответа клиенту
			$this->status = "ok";
			$this->data = $arr;
		}		
	}		
	$events = new Event($_REQUEST);
	//отправка ответа клиенту ((метод определен в родительском классе AjaxRequest))
	$events->showResponse();		
