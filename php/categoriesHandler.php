<?php
	// для инкапсуляции элементов: функций, классов и т.д.
	include 'Support/AjaxRequest.class.php';

	class Category extends AjaxRequest 
	{

		//названия функций, одна из которых будет вызвана
		public $actions = array(
			"getCategories" => "getCategories",
			"updCategories" => "updCategories",
		);
			
		public function __construct($request) {

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
		
		// получение списка категорий пользователя из бд
		public function getCategories() {
			$query = "SELECT id_category, category, selected FROM all_categories WHERE user_id = :user_id";
			$args = array (":user_id" => $this->user_id);
			$sth = $this->getData($query, $args);
			$result = array();
			//fetch - выдает следующую строку результирующего набора
			while ($row = $sth->fetch()){
					$result[$row['id_category']] = array('category'=>$row['category'], 'selected'=>$row['selected']);
			}
			$this->status = "ok";
			$this->data = $result;
		}

		// обновление списка категорий пользователя
		public function updCategories() {
			$content = $this->getRequestParam("json_string");
			$arr = $this->handleContent($content);
			
			foreach ($arr as $key =>&$value){
				$id_category = abs((int)$key);
				if  (isset($value->added)){
					//если категория была добавлена и сразу удалена, то переходим к следующей
					if ($value->deleted == true)
						continue;
					$new_category = $value->added;
					
					$query =  "INSERT INTO all_categories (user_id, category, selected) VALUES (:user_id, :category, :selected)";
					$args = array(':user_id' => $this->user_id, ':category' => $new_category->category,
						':selected' => $new_category->selected);					
					$id_category = $this->updTable($query, $args, true);
				}	
				if (isset($value->deleted) && ($value->deleted==true)){
					$new_category = "";
					$query =  "DELETE FROM all_categories WHERE id_category=:id_category";
					$args = array(':id_category' => $id_category);
					if ($this->updTable ($query, $args)){
						$query =  "UPDATE all_records SET category=:value WHERE id_category=:id_category AND user_id=:user_id";
						$args[':value'] = $new_category;
						$args[':user_id'] = $this->user_id;						
						$this->updTable($query, $args);
					}
					continue;
				}
				if (isset($value->category)){
					$new_category = trim(strip_tags($value->category));
					$query =  "UPDATE all_categories SET category=:value WHERE id_category=:id_category";
					$args = array(':value' => $new_category,':id_category' => $id_category);											
					if ($this->updTable($query, $args)){
						$query =  "UPDATE all_records SET category=:value WHERE id_category=:id_category AND user_id=:user_id";						
						$args[':user_id'] = $this->user_id;						
						$this->updTable($query, $args);
					}
				}
				if (isset($value->selected)){
					$new_selected = abs((int)$value->selected);
					$query =  "UPDATE all_categories SET selected=:value WHERE id_category=:id_category";
					$args = array(':value' => $new_selected,':id_category' => $id_category);						
					$this->updTable($query, $args);
				}
			}	
			$this->getCategories();
		}		
	}		
	$categories = new Category($_REQUEST);
	$categories->showResponse();		
