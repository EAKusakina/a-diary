<?php
	include 'Support/AjaxRequest.class.php';

	//обработчик для добавления, изменения, удаления категорий, а также для получения категорий пользователя из БД
	class Category extends AjaxRequest 
	{

		//названия методов, один из которых будет вызван
		public $actions = array(
			"getCategories" => "getCategories",
			"updCategories" => "updCategories",
		);
			
		public function __construct($request) {
			//подключились к БД 
			$this->connectDb();			
			//вызвали через родительский конструктор нужный метод (один из массива $actions)
			parent::__construct($request); 
		}
		/*деструктор вызвается при освобождении всех ссылок на определенный объект или при завершении скрипта (порядок выполнения деструкторов не гарантируется).*/
		public function __destruct()
		{
			$this->db = null;
		}
		
		// получает список категорий пользователя из БД
		public function getCategories() {
			$query = "SELECT id_category, category, selected FROM all_categories WHERE user_id = :user_id";
			$args = array (":user_id" => $this->user_id);
			//метод определен в трейте DataBase (подключается в родительском классе AjaxRequest)
			$sth = $this->getData($query, $args);
			$result = array();
			//fetch - выдает следующую строку результирующего набора
			while ($row = $sth->fetch()){
					$result[$row['id_category']] = array('category'=>$row['category'], 'selected'=>$row['selected']);
			}
			//свойства для формирования ответа клиенту
			$this->status = "ok";
			$this->data = $result;
		}

		// обновляет категории пользователя
		public function updCategories() {
			//разбираем полученную от клиента строку-запрос (методы определены в родительском классе AjaxRequest)
			$content = $this->getRequestParam("json_string");
			$arr = $this->handleContent($content);
			
			//каждый элемент массива содержит информацию об измененной категории
			foreach ($arr as $key =>&$value){
				$id_category = abs((int)$key);
				//если категория \ добавлена
				if  (isset($value->added)){
					//и сразу удалена, 
					if ($value->deleted == true)
						continue; //то переходим к следующей
					//подготваливаем запрос на добавление категории в БД
					$new_category = $value->added;
					$query =  "INSERT INTO all_categories (user_id, category, selected) VALUES (:user_id, :category, :selected)";
					$args = array(':user_id' => $this->user_id, ':category' => $new_category->category,
						':selected' => $new_category->selected);
					//метод определен в трейте DataBase (подключается в родительском классе AjaxRequest)						
					$id_category = $this->updTable($query, $args, true);
				}	
				//если категория со свойством deleted и оно равно true (тут перестраховываемся т.к. согласно categories.js свойство deleted будет удалено еще на клиенте, если пользователь передумал, но js может быть изменен)
				if (isset($value->deleted) && ($value->deleted==true)){
					$new_category = "";
					$query =  "DELETE FROM all_categories WHERE id_category=:id_category";
					$args = array(':id_category' => $id_category);
					//если успешно обновили таблицу all_categories
					if ($this->updTable ($query, $args)){
						//также обновим категории в событиях пользователя в таблице all_records
						$query =  "UPDATE all_records SET category=:value WHERE id_category=:id_category AND user_id=:user_id";
						$args[':value'] = $new_category;
						$args[':user_id'] = $this->user_id;						
						$this->updTable($query, $args);
					}
					//перейдем к следующей категории
					continue;
				}
				//если наименование категории было изменено
				if (isset($value->category)){
					$new_category = trim(strip_tags($value->category));
					$query =  "UPDATE all_categories SET category=:value WHERE id_category=:id_category";
					$args = array(':value' => $new_category,':id_category' => $id_category);
					//если успешно обновили таблицу  all_categories											
					if ($this->updTable($query, $args)){
						//также обновим категории в событиях пользователя в таблице all_records
						$query =  "UPDATE all_records SET category=:value WHERE id_category=:id_category AND user_id=:user_id";						
						$args[':user_id'] = $this->user_id;						
						$this->updTable($query, $args);
					}
				}
				//если категория перестала быть выбираемой по умолчанию или, наоборот, стала выбираемой по умолчанию
				if (isset($value->selected)){
					$new_selected = abs((int)$value->selected);
					$query =  "UPDATE all_categories SET selected=:value WHERE id_category=:id_category";
					$args = array(':value' => $new_selected,':id_category' => $id_category);	
					$this->updTable($query, $args);
				}
			}
			//выгрузим обновленный список категорий из БД
			$this->getCategories();
		}		
	}		
	$categories = new Category($_REQUEST);
	//отправка ответа клиенту ((метод определен в родительском классе AjaxRequest))
	$categories->showResponse();		
