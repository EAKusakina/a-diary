/* Функции общего назначения */		
	
	// возвращает cookie с именем name, если есть, если нет, то undefined
	function getCookie(name) {
		var matches = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"));
		return matches ? decodeURIComponent(matches[1]) : undefined;
	}
	
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

	//проверяет, по какому элементу был клик, и, если событие не было удалено, возвращает предка нужного элемента
	function checkClick (e, eName, that){
		//получаем элемент, по которому кликнули(поле таблицы или input/select, появляющийся в поле таблицы для редактирования ее содержимого)
		var t = e.target || e.srcElement;
		//получаем название тега
		var elmName = t.tagName.toLowerCase();
		//если это input/select - ничего не делаем
		if(elmName == eName)	{
			return false;
		}
		//если ячейка зачеркнута т.е. событие было удалено, запретим его редактировать  
		if (that.css('text-decoration') == "line-through")
			return false;
		//иначе для возвращаем предка элемента
		return that.parent();
	}			
	
	//создает списки опций для вывода часов или минут формы newEvent
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
	
	//создает каркас таблицы (заголовок и пустое body); headArr - массив с наименованиями столбцов
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
		this.authUrl = '/php/authorization.php';
		this.dataUrl = '/php/eventsHandler.php'; 
		this.categoriesUrl = '/php/categoriesHandler.php'; 
		this.accessToPage = '/php/loadPage.php'; 
	}
	
	//Методы конструктора ajax-запросов- в прототип
	//запрашивает данные с сервера
	AjaxRequestParent.prototype.requestData = function(url, action, json_string){
		return $.ajax({
			url: url,
			type: 'POST',
			dataType: 'json',
			data: {"act": action, "json_string":json_string, "user_id":userID},	
		});
	};	 		
	//выводит на страницу ошибки и предупреждения
	AjaxRequestParent.prototype.showErrorPage = function(error){
		if (error.responseText !== "")
			$('#data').html('<div id = "textError">' + error.responseText + '</div>');
		else
			$('#data').html('<div id = "textError"><h3>В связи с техническими неполадками сервис временно недоступен.</h3></div><p>Попробуйте зайти позднее.</p>');	
	};	 		

	//обработчик данных, полученных с сервера
	AjaxRequestParent.prototype.responseHandler = function (response) {	
		if (typeof response !== 'object') {
			try {
				response = JSON.parse(response);
			} catch (e) {
				/*не удалось преобразовать ответ сервера в объект, значит, мы не сможем им воспользоваться для вывода событий/категорий, получения userID, обновления событий в хранилище, хотя на сервере все обновилось; */
				$('#data').html('<div id = "textError"><h3>В связи с техническими неполадками сервис временно недоступен.</h3></div><p>Попробуйте зайти позднее.</p>');
				return false;
			}
		}					
		if (response.status === 'ok') //пользователь авторизован
			return response.data;
        else if (response.status === 'err') //пользователь не авторизован
			return null;
	};
	
	//Родительский конструктор для категорий 	
	function CategoriesParent (){
		//список объектов, содержащих категории, загружаемый с сервера
		this.obj = {};		
		//список объектов на изменение, который будет отправлен на сервер, если пользователь решит сохранить внесенные изменения
		this.updObj = {};					
	}
	
	// Методы родительского конструктора для категорий - в прототип
	
	//получает список категорий с сервера из БД
	CategoriesParent.prototype.requestToDB = function (ajaxObj, action, json_string){
		var self = this;
		$.when( ajaxObj.requestData(ajaxObj.categoriesUrl, action, json_string))
			.done(function (response) {
				var resp = ajaxObj.responseHandler(response);
				//если получили список категорий
				if (resp){
					//запишем его в объект
					self.obj = resp;
					//и выведем на экран
					self.showCategories();
				}
				self.updObj = {};
			}).fail(function (error) {
				/* если из-за ошибки мы не смогли получить список категорий с сервера и неизвестно, сохралились ли последние изменения на сервере*/
				//очистим список последних изменений
				self.updObj = {};
				//покажем страницу с ошибкой
				ajaxObj.showErrorPage(error);
			});			
	};
		
	//Родительский конструктор для событий 	
	function EventsParent (){
		this.obj = {};	
	}
	
	// Методы родительского конструктора для событий	

	//получает объект с событиями из базы данных
	EventsParent.prototype.getEventsFormDB = function (ajaxObject, item){
		//на время выполения запроса скроем таблицу с событиями и покажем картинку-заглушку
		$('#todos').hide();
		$('#preloader').show();

		var timeDifference = -1*(new Date().getTimezoneOffset());		
		var json_string = timeDifference+"|"+ JSON.stringify({t: item});
		var self = this;
		self.obj = {};
		//необходимо, чтобы getEventsFormDB() возвращал promise, который является результатом выполнения Ajax-запроса; поэтому вместо просто "$.when..." используем "return $.when...":  (http://stackoverflow.com/questions/31212391/jquery-promise-then-not-working-after-ajax)
		return ajaxObject.requestData(ajaxObject.dataUrl, "updEvents", json_string)
			.always(function () {
				//показали содержимое страницы
				$('#todos').show();
				$('#preloader').hide();				
			}).done(
			function (response) {	
				var resp = ajaxObject.responseHandler(response);
				if (resp) {
					//обработали полученный с сервера список событий
					for (var i in resp){
						try {
							resp[i].db_id = +resp[i].db_id;
							resp[i].date = new Date(resp[i].date);
							resp[i].user_id = +resp[i].user_id;
							resp[i].hours = +resp[i].hours;
							resp[i].minutes = +resp[i].minutes;
							resp[i].updateType = "";
						} catch(e) {
							ajaxObject.showErrorPage(e);
							return false;
						}
						self.obj[i] = resp[i];
					};
				}
			}).fail(function (error) {
				/*из-за ошибки мы не получили информацию из БД, следовательно нужно показать пользователю, что сервис временно недоступен*/
				ajaxObject.showErrorPage(error);				
			});
	};		
