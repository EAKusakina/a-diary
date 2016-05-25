
$(document).ready(function() {
	var tmpDate = new Date();
	var item = {
		db_id: 0,
		user_id: 0,
		date: tmpDate,
		hours: tmpDate.getHours(),
		minutes: (tmpDate.getMinutes()-tmpDate.getMinutes()%5),
		description: "",
		id_category: 0,
		category: "",
		wasDeleted: false, 
		updateType: ""
	};

	$.datepicker.setDefaults( $.datepicker.regional["ru"] );	
	
    $('body').on('change','#hours', function(){
		item.hours = +$(this).val(); //+ нужен для преобразования строки в int 
	});
    $('body').on('change','#minutes', function(){
		item.minutes = +$(this).val();
	});
    $('body').on('change','#category', function(){
		var cat = $(this).val();
		item.id_category = $(this).find("option:contains("+cat+")")[0]['id'];
		item.category = cat;
	});

	// обработка нажатия кнопки "Добавить"
    $('body').on('click','#add', function(){
		//запомнили, что ввел пользователь
		item.description = $('#description').val();
		//если пользователь не ввел ничего
    /*    if (item.description == "") {
			//выдали предупреждение
            $('#alert').html("</br><strong>Пожалуйста, заполните поле 'Описание события'</strong> ");
            $('#alert').fadeIn().delay(2000).fadeOut();
            //вернули false, чтобы оставшаяся часть кода не выполнилась и элемент не добавился в список
			return false;
        }
     */   //если пользователь решил создать событие с категорией, выбранной по умолчанию
		if (item.category == "") {
			item.id_category = +$("#category option:selected").attr('id');
			item.category = $("#category option:selected").val();
        }

		//используем для создания копии item, чтобы дальнейшие изменения item не повлекли изменения этой копии
		var copyElem = jQuery.extend({}, item);

		mainObj.createElem(copyElem);
        $('#todos').html(mainObj.printArr(item.date));
				
		localStorage.setItem(storageName, JSON.stringify(mainObj.arr));
		localStorage.setItem(lastDate,JSON.stringify(item.date));
		
		$('#description').val("");
        return false;
    });

	// обработка нажатия кнопки "Обновить"
    $('body').on('click','#refresh', function(){
		item.date = new Date($('#datepicker').datepicker("getDate"));
		mainObj.getArr(storageName, item);
		return false; // отменить переход по url и, следовательно, автоматическое обновление страницы, влекущее переход к текущей дате
	});

	//удаление элемента
	$('body').on('click','.del', function(elem){
		//получили предка: tr(input 'del'->td->tr)
		var par = $(this).parent().parent();
		//если чекбокс выбран
		if ($(this).prop('checked')){
			//зачеркнем содержимое всей строки
			$(par).find('td').css('text-decoration','line-through');
			//снимем галку с чекбокса копирования, если он был установлен(input 'del'->td->td->input 'copy')
			var copyCheckbox = $(this).parent().prev().children();
			copyCheckbox.prop('checked', false);
			mainObj.delElem($(par).attr('class'), "wasDeleted", true);
		}
		else {
			//сделаем содержимое всей строки незачеркнутым
			$(par).find('td').css('text-decoration','none');
			mainObj.delElem($(par).attr('class'), "wasDeleted", false);
		}	
		localStorage.setItem(storageName, JSON.stringify(mainObj.arr));
		localStorage.setItem(lastDate,JSON.stringify(item.date));
	});	
	
	//удаление всех элементов на странице (т.е. за опредеднную дату)
	$('body').on('click','#cleanAll', function(){
		var delArr = $('body #todos .del');
		var delArrLength = delArr.length;  
		//обрабатываем ситуацию, когда пользователь снял часть галок и при нажатии на cleanAll нужно, чтобы остальные тоже снялись 
		if ($('input[id="cleanAll"]').is(':checked')){
			for (var i = 0; i<delArrLength; i++){
				if (!delArr[i].checked)
					$(delArr[i]).click();
			};
		}
		else {
			for (var i = 0; i<delArrLength; i++){
				if (delArr[i].checked)
					$(delArr[i]).click();
			};			
		}			
	});
	
	//копирование элемента
	$('body').on('click','.copy', function(e){
		var $that = $(this); //тут чекбокс
		var td = $that.parent();//тут родительский td чекбокса 
		//если ячейка зачеркнута т.е. строка была удалена, выходим из функции
		if (td[0].outerHTML.indexOf("line-through")!= -1)
			return false;
		//получили предка: tr(input '.copy'->td->tr)
		var par = $that.parent().parent();
		//если чекбокс выбран непосредственно, не через верхний "Копировать" 
		if ($(this).prop('checked')){
			var code = '<input id="datepickerCopy" type="text">';
			var selectedNewDate = false;
			//вставили календарь на место чекбокса
			$that.parent().empty().append(code);
			$('#datepickerCopy').datepicker({
				dateFormat: "dd-mm-yy",
				//убираем визуальное выделение сегодняшней даты, чтобы пользователь выбрал дату сам
				onSelect: function (dateText, inst) {
					console.log(inst);
					inst.inline = true;
					selectedNewDate = true;
				},
				onClose: function(dateText, inst){
					//в паре с указанным в onSelect "inst.inline = true;" предотвращает закрытие календаря после выбора одной даты
					inst.inline = false;
					//обрабатываем последнюю выбранную в календаре дату
					if (selectedNewDate){
						//используем, чтобы создать копию элемента массива, изменения которой не повлекут изменения копируемого элемента 
						var copyElem = jQuery.extend({}, mainObj.arr[$(par).attr('class')]);
						copyElem.date = getSelectedDate(inst);					
						mainObj.createElem(copyElem);
						localStorage.setItem(storageName, JSON.stringify(mainObj.arr));
						$('#todos').html(mainObj.printArr(item.date));
						$('#alert').html("</br>Событие скопировано на: <b>" + dateText + "</b>");
						$('#alert').fadeIn().delay(1500).fadeOut();						
					}
					else 
						//если открыли и закрыли календарь, не выбрав никакой даты, вернем на место чекбокс
						$(td).empty().append("<input class ='copy' type='checkbox'>");				
				}
			}).on("keydown", function(e){ //закрытие календаря по нажатию на Enter 
				if (e.which == 13) {
					 e.preventDefault();
					$("#datepickerCopy").datepicker( "hide" );          
				}
			});			
			$("#datepickerCopy").datepicker('setDate', null);
			$("#datepickerCopy").datepicker( "show" );
		}
	});	

	//по нажатию на enter копируется событие даже без выбора даты
	
	
	//копирование всех элементов на странице (т.е. за определенную дату)
	$('body').on('click','#copyAll', function(){
		if ($('input[id="copyAll"]').is(':checked')){
			var copyArr = $('body #todos .copy').parent();
			var copyArrLength = copyArr.length;  
			for (var i = 0; i<copyArrLength; i++){
				if (copyArr[i].outerHTML.indexOf("line-through")== -1)
					copyArr[i].childNodes[0].checked = true;
			};
		}
		else 
			$('body #todos .copy').prop('checked', false);	
		var th = $(this).parent();//тут родительский th чекбокса 
		if ($('body #todos #copyAll').is(':checked') && $("body #but").length==0){
			var code = ' <input type="input" id="pickDate" class="datepicker"/><button id="but" type="button" class="btn btn-success btn-xs">Выберите дату</button>';
			//добавили к чекбоксу кнопку для выбора даты
			$(th).append(code);		
		}
		else {
			$('#pickDate').remove();
			$('#but').remove();			
		}	
		$('body').on('click','#but', function(){
			var selectedNewDate = false;
			$('#pickDate').datepicker({
				dateFormat: "dd-mm-yy",
				onSelect: function (dateText, inst) {
					inst.inline = true;
					selectedNewDate = true;
				},
				onClose: function(dateText, inst){
					//в паре с указанным в onSelect "inst.inline = true;" предотвращает закрытие календаря после выбора одной даты
					inst.inline = false;
					//обрабатываем последнюю выбранную в календаре дату
					if (selectedNewDate){
						//получили массив строк (td), которые выбраны для копирования 
						var copyArr = $('input[class="copy"]:checked').parent().parent();
						var copyArrLength = copyArr.length;  
						if (copyArrLength>0){
							var i = 0;
							while (i < copyArrLength){
								//используем, чтобы создать копию элемента массива, изменения которой не повлекут изменения копируемого элемента 
								var copyElem = jQuery.extend({}, mainObj.arr[copyArr[i].className]);
								copyElem.date = getSelectedDate(inst);
								mainObj.createElem(copyElem);								
								i++;
							}
							$('#alert').html("</br>Сделаны копии <b>" + dateText + "</b>");						
							$('#alert').fadeIn().delay(1500).fadeOut();				
						}
						localStorage.setItem(storageName, JSON.stringify(mainObj.arr));
						$('#todos').html(mainObj.printArr(item.date));
					}
				}
			});			
			$("#pickDate").datepicker( "show" );			
		});
		
	});	
	
	//редактирование поля "Описание" таблицы 
	$('body').on('click','#todos .desc', function(e){
		/*для последующего сохранения изменений в массив получаем предка*/
		var par = checkClick(e, 'input', $(this));
		if (!par)
			return false;
		//получаем содержимое ячейки
		var val = $(this).html();
		//формируем код текстового поля
		var code = '<input type="text" id="edit" value="'+val+'" />';
		//удаляем содержимое ячейки, вставляем в нее сформированное поле
		$(this).empty().append(code);
		var that = $(this);
		//устанавливаем фокус на это новое поле
		$('#edit').focus();
		$('#edit').blur(function()	{
			//получаем то, что находится в поле при снятии фокуса
			var val = $(this).val();
			//находим ячейку, удаляем устаревшее содержимое и вставляем значение из поля
			$(that).empty().html(val);
			mainObj.editElem($(par).attr('class'), "description", val);
		});
	});
	//редактирование поля "Категория" таблицы 
	$('body').on('click','#todos .category', function(e){
		var par = checkClick(e, 'select', $(this));
		if (!par)
			return false;
		var val = $(this).html();
		var code = '<select id="edit">'+categories.createCategories(val)+' </select>';
		$(this).empty().append(code);
		var that = $(this);
		$('#edit').focus();
		$('#edit').blur(function()	{
			var val = $(this).val();
			var new_id_category = $(this).find("option:contains("+val+")")[0]['id'];
			$(that).empty().html(val);
			mainObj.editElem($(par).attr('class'), "category", val);
			mainObj.editElem($(par).attr('class'), "id_category", new_id_category);
		});
	});
	
	//редактирование поля "Время" таблицы 
	$('body').on('click','#todos .time', function(e){
		var par = checkClick(e, 'select', $(this));
		if (!par)
			return false;
		var Hours = $(this).html().substring(0,2);
		var Minutes = $(this).html().substring(3);
		//код для вывод select с часами
		var codeHours = '<select id="editHours">'+createOptions(24, 1)+'</select>';
		//select инициализируется ранее выбранными часами 
		codeHours = codeHours.replace(">"+Hours,' selected>'+Hours);
		//код для вывод select с минутами
		var codeMinutes = '<select id="editMinutes">'+createOptions (60, 5)+'</select>';
		//select инициализируется ранее выбранными минутами 
		codeMinutes = codeMinutes.replace('>'+Minutes,' selected>'+Minutes);
		$(this).empty().append(codeHours+codeMinutes);
		$('#editHours').focus();
		var hoursWereChanged = false;

		$('#editHours').blur(function(e){
			Hours = $(this).val();
			mainObj.editElem($(par).attr('class'), "hours", +Hours);
			hoursWereChanged = true;
		});

		$(document).on('mouseup', function (e){ // событие клика по веб-документу
			var elem = $("#editMinutes"); // тут указываем элемент
			if (elem.is(e.target)) { // если клик был по указанному элементу
				$('#editMinutes').focus();
			}
			else if (hoursWereChanged){
				$('#todos').html(mainObj.printArr(item.date));
				/* Обязательно убивать тут обработчик, иначе верхняя on click сработает 1 раз на одной ячейке и больше на этой ячейке работать не будет!!!
				"Для неоднократно динамически-подгружаемых скриптов" нужно использовать off*/
				$(document).off('mouseup');
			}
		});
		$('#editMinutes').blur(function(){
			Minutes = $(this).val();
			mainObj.editElem($(par).attr('class'), "minutes", +Minutes);
			$('#todos').html(mainObj.printArr(item.date));
		});					
	});

	//редактирование поля "Дата" таблицы 
	$('body').on('click','#todos .date', function(e){
		var par = checkClick(e, 'input', $(this));
		if (!par)
			return false;
		var val = $(this).html();
		var code = '<input id="datepickerTable" type="text">';
		var selectedNewDate = false;
		var that = $(this);
		$(that).empty().append(code);
		$('#datepickerTable').datepicker({
			dateFormat: "dd-mm-yy",
			onSelect: function (dateText, inst) {
					inst.inline = true;
					selectedNewDate = true;
			},
			onClose: function(dateText, inst){
					inst.inline = false;
				if (selectedNewDate){
					mainObj.editElem($(par).attr('class'), "date", getSelectedDate(inst));
					setTimeout(function(){$('#todos').html(mainObj.printArr(item.date))}, 2000);			
					//если в календаре выбрали дату, показываем сообщение
					$(that).empty().html("Новая дата события: <b>" + dateText + "</b>");
				}
				else 	
					//если открыли и закрыли календарь, не изменяя даты, убираем input и возвращаем прежнее значение
					$(that).empty().html(val);				
			}
		}).on("keydown", function(e){ //закрытие календаря по нажатию на Enter 
				if (e.which == 13) {
					$("#datepickerTable").datepicker( "hide" );          
				}
			});						
		$("#datepickerTable").datepicker( "show" );
	});
	//сохранение изменений при выходе из полей/календарей по нажатию Enter 
	$(window).keydown(function(event){
		//ловим событие нажатия клавиши
		if(event.keyCode == 13) {	//если это Enter
			$('#edit').blur();	//снимаем фокус с поля ввода
			$('#editHours').blur();
			$('#editMinutes').blur();
			$("#pickDate").datepicker( "hide" );          
			$(document).off('mouseup');
		}
	});
	
//alert( document.cookie );

	//Дочерний конструктор для событий
	function Events (){
		EventsParent.apply(this, arguments);
	}
	//Наследование свойств и методов родительского конструктора (определен в файле proto.js) 
	Events.prototype = Object.create(EventsParent.prototype);
	Events.prototype.constructor = Events;

	//Методы дочернего конструктора событий
	
	//получает объект с событиями из хранилища или БД и выводит его на экран
	Events.prototype.getArr = function (storageName, item){
		var self = this;
	
//	window.localStorage.removeItem(storageName);				

		//Eсли нет локального хранилища с ключом storageName,
		if (!this.getArrFormStorage(storageName)){
			//то пробуем получить массив из БД
			this.getArrFormDB(ajaxObject, item)//когда ожидаем только один promise, можно обойтись без when 
				.then( function(){
//					console.log(self.arr);
					localStorage.setItem(storageName, JSON.stringify(self.arr));
					$('#todos').html(self.printArr(item.date));
				}); 		
		}
		else {
			this.arr = ajaxObject.checkArr(this.arr, storageName, "onEvent");
			localStorage.setItem(storageName, JSON.stringify(this.arr));
			$('#todos').html(this.printArr(item.date)); 		
		}
	};

	Events.prototype.createElem = function(item){
		var tmpID;
		do {
			/*Максимальное целое в js = 2^53-1, но в MySQL под int, в котором храним id, выделено всего 11 разрядов => числовая константа для рандома будет 99 999 999 999*/
			tmpID = Math.floor(Math.random() * (99999999999 + 1));
			/*Проверка не существует ли такого же номера*/
		} while (tmpID in this.arr)
		item.updateType = "add";
		this.arr[tmpID] = item;
	};
		
	Events.prototype.editElem = function (idElem, attribute, value){
		//ищем номер элемента массива, который редактируем
		this.arr[idElem][attribute] = value;
		//если добавленный или уже обновленный, то оставим как было, иначе
		if (this.arr[idElem].updateType === "")
			this.arr[idElem].updateType = "upd";
		//сохранили в хранилище
		localStorage.setItem(storageName, JSON.stringify(this.arr));						
	};
		
	Events.prototype.delElem = function (idElem, attribute, value){
			this.arr[idElem][attribute] = value;
	}

	//сортировка данных для вывода на страницу	
	Events.prototype.sortArr = function  (a,b){
		switch (a.hours == b.hours){
			case true: 
				switch (a.minutes == b.minutes){
					case true: 
						if (a.description >= b.description)
							return 1;
						else 
							return -1;
					case false:
						if (a.minutes > b.minutes)
							return 1;
						else
							return -1;														
				}
			case false:
				if (a.hours > b.hours)
					return 1;
				else 
					return -1;
		}
	};
		
	Events.prototype.printArr = function(pickedDate){
		var tmpArr = [];
		for (var i in this.arr){
			if (this.arr[i].date.getFullYear()==pickedDate.getFullYear() && this.arr[i].date.getMonth()==pickedDate.getMonth() && this.arr[i].date.getDate()==pickedDate.getDate() && !this.arr[i].wasDeleted){
				var tmpElem = jQuery.extend({}, this.arr[i]);
				tmpElem.id = i;
				tmpArr.push(tmpElem);
			}
		}
		tmpArr.sort(this.sortArr);
		
		var headArr = ['Дата', 'Время', 'Описание', 'Категория', "<input id='copyAll' type='checkbox'> Копировать","<input id='cleanAll' type='checkbox'> Удалить"];
		var table = createEmptyTable(headArr);
		var tbody = table.children()[1];
		var counter = 0, row;
		var options = {
					year: 'numeric',
					month: '2-digit',
					day: 'numeric',
			};
		tmpArr.forEach(function(item){
			row = $('<tr></tr>').attr({ class: item.id }).appendTo(tbody);
			var date = item.date.toLocaleString("ru", options);
			var h = (item.hours < 10) ? "0" + item.hours : item.hours;
			var m = (item.minutes < 10) ? "0" + item.minutes : item.minutes;
			$('<td></td>').attr({ class:"date"}).html(date).appendTo(row); 
			$('<td></td>').attr({ class:"time"}).html(h + ":" + m).appendTo(row); 
			$('<td></td>').attr({ class:"desc"}).html(item.description).appendTo(row); 
			$('<td></td>').attr({ class:"category"}).html(item.category).appendTo(row); 
			$('<td></td>').html("<input class ='copy' type='checkbox'>").appendTo(row); 
			$('<td></td>').html("<input class ='del' type='checkbox'>").appendTo(row); 
			counter++;		 			
		});	
		if (counter == 0){
			row = $('<tr></tr>').appendTo(tbody);
			$('<td></td>').html("<b>Нет данных за выбранную дату</b>").appendTo(row); 
		}
		return table;
	};
	
	//Дочерний конструктор для категорий
	function Categories (){
		CategoriesParent.apply(this, arguments);
	}
	//Наследование свойств и методов родительского конструктора (определен в файле proto.js) 
	Categories.prototype = Object.create(CategoriesParent.prototype);
	Categories.prototype.constructor = Categories;

	//Методы дочернего конструктора для категорий - в прототип 
	Categories.prototype.createCategories = function (val){
		var text = ""; 
		for (var i in this.obj) {
			//перебираем все элементы в категориях и создаем под них options
			if ((this.obj[i]['category'] == val) || (this.obj[i]['selected']==1 && val==undefined))
				text += "<option id ='"+i+"' value='" + this.obj[i]['category'] + "' selected>" + this.obj[i]['category'] + "</option>";	
			else
				text += "<option id ='"+i+"' value='" + this.obj[i]['category'] + "'>" + this.obj[i]['category'] + "</option>";	
		}
		return text;
	}
		
	Categories.prototype.showCategories = function (){
		var listOfCategories = this.createCategories();
		//если пользователь удалил все категории
		if ( listOfCategories == "")
			$('#category').hide();
		else 				
			$('#category').html(listOfCategories);			
	}	

	//Дочерний конструктор для ajax-запросов
	function AjaxRequest (){
		//вызов родительского конструктора; функция AjaxRequestParent выполнится в контексте текущего объекта, со всеми аргументами, и запишет в this всё, что нужно.
		AjaxRequestParent.apply(this, arguments);
	}
	//Наследование свойств и методов родительского конструктора (определен в файле proto.js) 
	AjaxRequest.prototype = Object.create(AjaxRequestParent.prototype);
	AjaxRequest.prototype.constructor = AjaxRequest;

	//Методы дочернего конструктора для ajax-запросов
	
	//проверяем, есть ли в объекте новые, измененные или удаленные события, отправляем их серверу и обрабатываем ответ
	AjaxRequest.prototype.checkArr = function (arr, storageName, invokeType){
		var self = this;
		console.log("I'm here");
		var serverArr = {};
		for (var i in arr){
			if (arr[i].wasDeleted && invokeType==="onEvent"){
				console.log("Присвоили updateType del");
				if (arr[i].updateType.indexOf('del')==-1){
					arr[i].updateType = arr[i].updateType+"del";
				}
				serverArr[i]=arr[i];
				continue;
			}
			if (arr[i].updateType != "" && arr[i].updateType != undefined){
				serverArr[i]=arr[i];
			}
		};
		//только если в массиве есть какие-то изменения, тогда делаем запрос к серверу 
		if (!isEmpty(serverArr)){
			//подготовим объект для передачи серверу
			//разница во времени со временем по Гринвичу, чтобы записать в БД верную дату
			var timeDifference = -1*(new Date().getTimezoneOffset());		
			var json_string = timeDifference+"|"+ JSON.stringify(serverArr);
			var url = self.dataUrl;
			$.when( self.requestData(url, "updEvents", json_string)).then(
				function (response) {
					console.log(response);
					response = self.reponseHandler(response);
					if (response){
						for (var i in arr){
							//удаляем элемент из массива только если он был успешно удален на сервере 
							if (arr[i].wasDeleted && invokeType==="onEvent"){
								delete arr[i];						
								continue;
							}
							if (arr[i].updateType == "add")
								arr[i].db_id = response[i].db_id;							
							arr[i].updateType = "";
						}
						//актуализируем объект в хранилище
						localStorage.setItem(storageName, JSON.stringify(arr));	
					}
				},
				/*если из-за ошибки мы не можем обновить данные на сервере, значит, нужно временно запретить пользователю дальнейшую работу с данными, пока ошибка не будет исправлена 
				*/
				function (error) {
					self.showErrorPage(error, 'AjaxRequest.prototype.checkArr');
				}
			);			
		}
		return arr;
	}
	
	var mainObj = new Events ();
	var categories = new Categories ();	
	var ajaxObject = new AjaxRequest ();
	var lastDate = 'lastDate'+storageName;
	
//	console.log('userID = '+storageName);

	$('body').on('loadToday','#data', function(){
		item.user_id = userID;
//window.localStorage.removeItem(storageName);
		//получим массив из локального хранилища или бд и выведем его на экран
		mainObj.getArr(storageName, item);
		//создание списка категорий
		categories.requestToDB(ajaxObject, 'getCategories');
		//каждые 30 секунд проверяем, были ли изменения в списке событий и, если были, передаем их в БД 
		intervalID = setInterval(function (){
					mainObj.arr = ajaxObject.checkArr(mainObj.arr, storageName, "auto");
					}, 30000
		);				
		$('#datepicker').datepicker({ 
			dateFormat: 'dd-mm-yy', 
			onClose: function (dateText, inst) {
				item.date = getSelectedDate(inst);
				mainObj.getArr(storageName, item);		
				localStorage.setItem(lastDate,JSON.stringify(item.date));
			}
		}).on("keydown", function(e){ //закрытие календаря по нажатию на Enter 
			if (e.which == 13) {
				 e.preventDefault();
				$("#datepicker").datepicker( "hide" );          
			}
		});
		//инициализация элементов формы при загрузке страницы
		$('#datepicker').datepicker('setDate', item.date);
		$('#hours').val(function(){
			var hours = item.hours;
			if (hours < 10){
				hours = "0"+hours;
			}	
			return hours;	
		});
		$('#minutes').val(function(){
			//получаем минуты с точнностью до 5 минут с округлением в меньшую сторону (если сейчас 58 минут, то вернет 55)
			var min = item.minutes;
			if (min < 10){
				min = "0"+min;
			}
			return min;	
		});
	});
	//Когда пользователь нажмет на кнопку будет удален весь список, локальное хранилище и бд будут очищены:
	$('body').on('click','#clear', function(e){
		var confirmDelete = confirm("Вы подтверждаете удаление записей о событиях за все даты?");
		if (confirmDelete) {
			for (var i in mainObj.arr){
				mainObj.arr[i].wasDeleted = true;
			};
			ajaxObject.checkArr(mainObj.arr, storageName, "onEvent");
			mainObj.arr = {};
			window.localStorage.removeItem(storageName);
			$('#todos').html(mainObj.printArr(item.date));
		}
        return false;
    });
});
