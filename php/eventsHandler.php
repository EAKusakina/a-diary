<?php
	include 'Support/AjaxRequest.class.php';
	//��������������� ����� ��� �������� ��������
	class tmp{};
	
	//���������� ��� ����������, ���������, �������� �������, � ����� ��� ��������� ������� ������������ �� ��
	class Event extends AjaxRequest 
	{
		//�������� �������, ���� �� ������� ����� ������
		public $actions = array(
			"updEvents" => "updEvents",
		);
			
		public function __construct($request)
		{
			//������������ � �� 
			$this->connectDb();			
			//������� ����� ������������ ����������� ������ �����
			parent::__construct($request); 
		}
		/*���������� ����� ������ ��� ������������ ���� ������ �� ������������ ������ ��� ��� ���������� ������� (������� ���������� ������������ �� �������������).*/
		public function __destruct()
		{
			$this->db = null;
		}
		
		// ��������� ������ ������� ������������
		public function updEvents() {
			//��������� ���������� �� ������� ������-������ (������ ���������� � ������������ ������ AjaxRequest)
			$content = $this->getRequestParam("json_string");
			// ������ ���������� ������: �������_��_�������|������ � ������� JSON. ��������: -3|{"t":{"updateType":"delAll","user_id":"84"}}
			$pos = strpos($content, '|');
			$timeDifference = substr($content, 0, $pos);
			$content = substr(strstr($content, '|'), 1);
			$arr = $this->handleContent($content);
			
			//������ ������� ������� �������� ���������� ���� �� �������� ������� ���� � ������������� �������� ������ ������� �� ��
			foreach ($arr as &$value){
				$args = array();
				//���������� ����� case � switch ���� ����� �����������
				$action = trim(strip_tags($value->updateType));
				//���� ������� ��������� � ����� �������, �� ��������� � ����������
				if ($action == 'adddel')
					continue;
				//������������ �������� �������� ������� 
				$db_id = abs((int)$value->db_id);
				$user_id = abs((int)$value->user_id);
				$date = date('Y-m-d',strtotime($value->date)+$timeDifference*60);
				$hours = abs((int)$value->hours);
				$minutes = abs((int)$value->minutes);
				//����� ������� mysql_real_escape_string ��� ������ (� description ��������� �������� �������) �� ���� ������������. �� ������������, ����� ����� ������� ����������� �� php, ����� ��� ������� �� ������� ������ �������. � � �������������� ������� ����� ������ ������� ��� �������, �������� ������ ������ ����������, �.�. �� ����� ��� ��� ������, � �� ��� �������.
				$description = trim(strip_tags($value->description));
				$category = trim(strip_tags($value->category));
				$id_category = abs((int)$value->id_category);
				switch ($action) {
					case 'add'://���������� �������
						$sql = "INSERT INTO all_records (user_id, date, hours, minutes, description, category, id_category) VALUES (:user_id, :date, :hours, :minutes, :description, :category, :id_category)";
						$args = array(':user_id' => $user_id, ':date' => $date, ':hours' => $hours, ':minutes' => $minutes, ':description' => $description, ':category' => $category, ':id_category' => $id_category);
						//����� ��������� � ������ DataBase (������������ � ������������ ������ AjaxRequest)
						$value->db_id = $this->updTable($sql, $args, true);
						break;
					case 'upd'://��������� �������
						$sql = "UPDATE all_records SET date=:date, hours=:hours, minutes=:minutes, description=:description, category=:category, id_category=:id_category WHERE db_id=:db_id";
						$args = array(':db_id' => $db_id, ':date' => $date, ':hours' => $hours, ':minutes' => $minutes, ':description' => $description, ':category' => $category, ':id_category' => $id_category);	
						$this->updTable($sql, $args);
						break;
					case 'del'://�������� �������
					case 'upddel'://�������� � �������� �������
						$sql = "DELETE FROM all_records WHERE db_id=:db_id";
						$args = array(':db_id' => $db_id);	
						$this->updTable($sql, $args);
						break;
					case 'delAll'://�������� ���� ������� ������������
						$sql = "DELETE FROM all_records WHERE user_id=:user_id";
						$args = array(':user_id' => $user_id);	
						$this->updTable($sql, $args);
						break;					
					case 'get'://��������� ������� �� ������������ ����
						$sql = "SELECT db_id, user_id, date, hours, minutes, description, category, id_category FROM all_records WHERE user_id=:user_id AND date=:date";
						$args = array(':user_id' => $user_id, ':date' => $date);
						//������ break, ����� ��������� case-�� ��� ������ �.�. ��������� ���������� �� �� ������ � get � getAll ���������� 
					case 'getAll'://��������� ������� �� ��� ����
						//���� $sql �� ���������� ��� ����� (�.�. � ������� getAll)
						if (!isset($sql) || empty($sql)) {
							$sql = "SELECT db_id, user_id, date, hours, minutes, description, category, id_category FROM all_records WHERE user_id=:user_id";
							$args = array(':user_id' => $user_id);
						}
						//����� ��������� � ������ DataBase (������������ � ������������ ������ AjaxRequest)
						$sth = $this->getData($sql, $args);
						$arr = new tmp;
						$i = 0;
						while ($row = $sth->fetch(PDO::FETCH_ASSOC)){
							//���������� �� �� ���� ����������� �  ������ ��������� ISO 8601, ����� �� ��� �������� �� ������� ������� �� ������(Chrome ������, IE � FireFox - ���)
							$row['date'] = date_create($row['date']);
							$row['date'] = date_format($row['date'], 'c');
							$arr->$i = (object)$row;	
							$i++;
						}
						break;
				}								
			}
			//�������� ��� ������������ ������ �������
			$this->status = "ok";
			$this->data = $arr;
		}		
	}		
	$events = new Event($_REQUEST);
	//�������� ������ ������� ((����� ��������� � ������������ ������ AjaxRequest))
	$events->showResponse();		
