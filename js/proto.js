
/* Функции общего назначения */	
	
	
//эмулировать Object.create!!
	
	//вспомогательная функция, которая получает инстанцированный объект календаря и возвращает для него объект Date, соответствующий текущей выбранной дате
	function getSelectedDate (inst){
		return new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay);
	}

	//проверяет, пуст ли объект
	function isEmpty(obj) {
	  for (var key in obj) {
		return false;
	  }
	  return true;
	}

	//проверяет, по тому ли элементу кликнули и не было ли событие удалено
	function checkClick (e, eName, that){
		//получаем элемент, по которому кликнули(поле таблицы или input/select, появляющийся в поле таблицы для редактирования ее содержимого)
		var t = e.target || e.srcElement;
		//получаем название тега
		var elmName = t.tagName.toLowerCase();
		//если это input/select - ничего не делаем
		if(elmName == eName)	
			return false;
		//если ячейка зачеркнута т.е. событие было удалено, запретим его редактировать  
		if (that[0].outerHTML.indexOf("line-through")!= -1)
			return false;
		//иначе для последующего сохранения изменений в массив получаем предка: tr(td->tr)
		return that.parent();
	}			
	
	//создает списки опций для вывода часов или минут
	function createOptions (max, step){
		var result = "", tmp;
		for (var i = 0; i<max; i=i+step){
			if (i<10)
				tmp = new Option("0"+i, "0"+i);
			else 
				tmp = new Option(i, i);
			result = result + tmp.outerHTML;			
		}
		return result;
	}
	
	//создает каркас таблицы (заголовок и пустое body)
	function createEmptyTable (headArr){
		var div = $('<div></div>');
		var mytable = $('<table></table>').attr({ class: "table table-striped" }).appendTo(div);
		var thead = $('<thead></thead>').appendTo(mytable);
		var row = $('<tr></tr>').attr({ class: "info" }).appendTo(thead);
		var cols = headArr.length;
		for (var j = 0; j < cols; j++) {
			$('<th></th>').html(headArr[j]).appendTo(row); 
		}
		var tbody = $('<tbody></tbody>').appendTo(mytable);
		return mytable;
	}
	
	
/* Родительские конструкторы */		

	//Родительский конструктор ajax-запросов
	function AjaxRequestParent (){
		this.accessToData = '/php/authorization.php';
		this.dataUrl = '/php/eventsHandler.php'; 
		this.categoriesUrl = '/php/categoriesHandler.php'; 
		this.accessToPage = '/php/loadPage.php'; 
	}
	
	//Методы конструктора ajax-запросов- в прототип
	AjaxRequestParent.prototype.requestData = function(url, action, json_string= null){
		var self = this;
		var t = $.ajax({
			url: url,
//			type: 'GET',
			type: 'POST',
			dataType: 'json',
			data: {"act": action, "json_string":json_string},					
		});
		return t;
	};	 		
//убрать вывод источника ошибки!!
	AjaxRequestParent.prototype.showErrorPage = function(error, sourse){
		if (error.responseText !== "")
			$('#data').html('<div id = "textError">' + error.responseText + '</div><p>Попробуйте зайти позднее.</p><br><p>Источник ошибки: '+sourse+'</p>');
		else
			$('#data').html('<div id = "textError"><h3>В связи с техническими неполадками сервис временно недоступен.</h3></div><p>Попробуйте зайти позднее.</p><br><p>Источник ошибки: '+sourse+'</p>');	
	};	 		


	AjaxRequestParent.prototype.reponseHandler = function (response) {
		if (typeof response !== 'object') {
			try {
				response = JSON.parse(response);
			} catch (e) {
				/*не удалось преобразовать ответ сервера в объект, значит, мы не сможем им воспользоваться для вывода событий/категорий, обновления событий/категорий в хранилище, хотя на сервере все обновилось; */
				$('#data').html('<div id = "textError"><h3>В связи с техническими неполадками сервис временно недоступен.</h3></div><p>Попробуйте зайти позднее.</p>');
				return false;
			}
		}					
		if (response.status === 'ok') {
			return response.data;
        } else if (response.status === 'err') {
			//пользователь оказался не авторизован, следовательно на сервере ничего не обновилось
			$('#data').html('<div id = "textError"><h3>Для работы с данными необходимо войти на сайт.</h3></div>');			
			return false;
        }			
	};
	
	//Родительский конструктор для категорий 	
	function CategoriesParent (){
		this.obj = {};		
		this.updObj = {};					
	}
	
	// Методы родительского конструктора для категорий - в прототип	
	CategoriesParent.prototype.requestToDB = function (ajaxObj, action, json_string=null){
		var self = this;
		var url = ajaxObj.categoriesUrl;	
		$.when( ajaxObj.requestData(url, action, json_string)).done(
			function (response) {
				var resp = ajaxObj.reponseHandler(response);
				if (resp){
					self.obj = resp;
					self.showCategories();
					if (action == "updCategories")
						self.updLocalStorage(self.updObj);
					self.updObj = {};
				} else {
					/*удалим хранилище, чтобы потом получить актуальную версию списка событий из БД  
					*/
					window.localStorage.removeItem(storageName);
					self.updObj = {};
				}
			}).fail(function (error) {
				/* если из-за ошибки мы не смогли получить список категорий с сервера и неизвестно, сохралились ли последние изменения на сервере
				*/
				//очистим список последних изменений
				self.updObj = {};
				//покажем страницу с ошибкой
				ajaxObj.showErrorPage(error, 'CategoriesParent.prototype.requestToDB');
				/*удалим хранилище, чтобы потом получить актуальную версию списка событий из БД  
				*/
				window.localStorage.removeItem(storageName);				
			});			
	};
		
	//Родительский конструктор для событий 	
	function EventsParent (){
		this.arr = {};		
	}
	
	// Методы родительского конструктора для событий	

	//получает объект с событиями из локального хранилища
	EventsParent.prototype.getArrFormStorage = function(storageName){
		if (localStorage.getItem(storageName)) {
			try {
				this.arr = JSON.parse(localStorage.getItem(storageName));
			} catch(e) {
//				alert('Ошибка при получении объекта из локального хранилища: ' + e.name + ":" + e.message + "\n" + e.stack);
				//в этом случае еще можно попытаться получить список событий из БД, поэтому просто вернем false
				return false;
			}		
			//для корректного отображения дат превратим строки JSON обратно в объекты
			for (var i in this.arr){
				try {
					this.arr[i].date = new Date(this.arr[i].date);
				} catch(e) {
//				 	alert('Ошибка при преобразовании строк в даты: ' + e.name + ":" + e.message + "\n" + e.stack); 
					//в этом случае еще можно попытаться получить список событий из БД, поэтому просто вернем false
					return false;
				}
			};
			return true;
		} else
			return false;
	};
				
	//получает объект с событиями из базы данных
	EventsParent.prototype.getArrFormDB = function (ajaxObject, item){
			$('#allContent').hide();
			$('#preloader').show();

			item.updateType = 'get';
			var tmp = {t: item};
			var timeDifference = -1*(new Date().getTimezoneOffset());		
			var json_string = timeDifference+"|"+ JSON.stringify(tmp);
			var url = ajaxObject.dataUrl;
			var self = this;
			
			//необходимо убедиться, что getArrFormDB() возвращает promise, который является результатом выполнения Ajax-запроса; поэтому вместо просто "$.when..." используем "return $.when...":  (http://stackoverflow.com/questions/31212391/jquery-promise-then-not-working-after-ajax)
			return $.when(ajaxObject.requestData(url, "updEvents", json_string))
				.always(function () {
					$('#preloader').hide();				
					$('#allContent').show();
				}).done(
				function (response) {					
					console.log(response);
					if (typeof response !== 'object') {
						try {
							response = JSON.parse(response);
						} catch (e) {
							//не удалось преобразовать ответ сервера в объект, значит, мы не сможем им воспользоваться 
							$('#data').html('<div id = "textError"><h3>В связи с техническими неполадками сервис временно недоступен.</h3></div><p>Попробуйте зайти позднее.</p>');	
							return;
						}
					}
					response = response.data;					
					for (var i in response){
						try {
							response[i].db_id = +response[i].db_id;
							response[i].date = new Date(response[i].date);
							response[i].user_id = +response[i].user_id;
							response[i].hours = +response[i].hours;
							response[i].minutes = +response[i].minutes;
							response[i].updateType = "";
						} catch(e) {
//							alert('Ошибка при преобразовании строк в свойства объекта: ' + e.name + ":" + e.message + "\n" + e.stack); 
							ajaxObject.showErrorPage(e, 'EventsParent.prototype.getArrFormDB.done');
							return false;
						}
						self.arr[i] = response[i];
					};
					console.log(self.arr);
				}).fail(function (error) {
					/*из-за ошибки мы не получили информацию из БД, следовательно нужно показать пользователю, что сервис временно недоступен
					*/
					ajaxObject.showErrorPage(error, 'EventsParent.prototype.getArrFormDB.fail');				
				});
	};		
