
//Функционал на странице "Создание, редактирование и удаление событий"
$(document).ready(function() {
	//объект, содержащий текущие дату, время, установленную по умолчанюи категорию; используется для инициализации формы newEvent, в которой пользователь вводит новое событие, для добавления нового объекта в список объектов с событиями 	
	var item = {
		db_id: 0,
		user_id: 0,
		date: new Date(),
		hours: new Date().getHours(),
		//минуты округляем в меньшую сторону с учетом того, что выбор минут предоставляется с 5 минутным интервалом (0, 5, 10 и т.д.)  
		minutes: (new Date().getMinutes()- new Date().getMinutes()%5),
		description: "",
		id_category: 0,
		category: "",
		wasDeleted: false, 
		updateType: ""
	};
	//устанавливаем для всех календарей русский язык
	$.datepicker.setDefaults( $.datepicker.regional["ru"] );
	//по пользовательскому событию changeColorButton кнопка "Сохранить изменения" меняет цвет с голубого на красный
    $('body').on('changeColorButton',function(){
		$('#refresh').addClass('btn-danger').removeClass('btn-info');
	});
	//при изменении часов в форме newEvent меняем часы в item, чтобы он всегда был в актуальном состоянии
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
		//если пользователь решил создать событие с категорией, выбранной по умолчанию
		if (item.category == "") {
			item.id_category = +$("#category option:selected").attr('id');
			item.category = $("#category option:selected").val();
        }
		//используем для создания копии item, чтобы дальнейшие изменения item не повлекли изменения этой копии
		var copyElem = jQuery.extend({}, item);
		events.createElem(copyElem);
		//обновим список событий на странице
        $('#todos').html(events.showEvents());
		//сделаем поле "Описание события" снова пустым
		$('#description').val("");
		//подсветим кнопку "Сохранить изменения" красным цветом
		$('body').trigger("changeColorButton");
    });

	// обработка нажатия кнопки "Сохранить изменения"
    $('body').on('click','#refresh', function(){
		//сохраним изменения в БД на сервере
		events.obj = ajaxObject.saveChanges(events.obj);
		//обновим список событий на странице
        $('#todos').html(events.showEvents());
		//подсветим кнопку "Сохранить изменения" голубым цветом
		$(this).removeClass('btn-danger').addClass('btn-info');
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
			//присвоим свойству удаляемого объекта "wasDeleted" значение true
			events.delElem($(par).attr('class'), "wasDeleted", true);
			//подсветим кнопку "Сохранить изменения" красным цветом
			$('body').trigger("changeColorButton");
		}
		else {
			//сделаем содержимое всей строки незачеркнутым
			$(par).find('td').css('text-decoration','none');
			//присвоим свойству объекта "wasDeleted" значение false
			events.delElem($(par).attr('class'), "wasDeleted", false);
			//проверка, нужно ли сделать кнопку "Сохранить изменения" обратно голубой (если, например, пользователь выбрал событие на удаление, а потом отменил удаление, не внося больше никаких других изменений)
			var strUpdType = "";
			for (var i in events.obj){
				//если есть хоть один удаленный/измененный/добавленный объект, дальше просматривать объекты нет смысла - все равно нужно будет оставить кнопку "Сохранить изменения" красной
				if (events.obj[i].wasDeleted || events.obj[i].updateType != "") {
					strUpdType = "1";
					return;
				}
			};
			//подсветим кнопку "Сохранить изменения" голубым цветом
			$('body #refresh').removeClass('btn-danger').addClass('btn-info');		
		}	
	});	
	
	//удаление всех элементов на странице (т.е. за опредеднную дату)
	$('body').on('click','#cleanAll', function(){
		var delList = $('body .del');
		var delListLength = delList.length;  
		//обрабатываем также ситуацию, когда пользователь снял часть галок и при нажатии на cleanAll нужно, чтобы остальные тоже снялись 
		if ($('input[id="cleanAll"]').is(':checked')){
			for (var i = 0; i<delListLength; i++){
				if (!delList[i].checked)
					$(delList[i]).click();
			};
		}
		else {
			for (var i = 0; i<delListLength; i++){
				if (delList[i].checked)
					$(delList[i]).click();
			};			
		}			
	});
	
	//копирование элемента
	$('body').on('click','.copy', function(e){
		var $that = $(this); //тут чекбокс
		var td = $that.parent();//тут родительский td чекбокса
		//если ячейка зачеркнута т.е. строка была удалена, выходим из функции
		if (td.css('text-decoration') == "line-through")
			return false;
		//получили предка: tr(input '.copy'->td->tr)
		var par = $that.parent().parent();
		//если чекбокс отмечен 
		if ($(this).prop('checked')){
			//вставили код с календарем на место чекбокса
			$that.parent().empty().append('<input id="datepickerCopy" type="text">');
			//свойства и методы календаря
			$('#datepickerCopy').datepicker({
				dateFormat: "dd-mm-yy",
				onSelect: function (dateText, inst) {
					inst.inline = true;
				},
				onClose: function(dateText, inst){
					//в паре с указанным в onSelect "inst.inline = true;" предотвращает закрытие календаря после выбора одной даты
					inst.inline = false;
					//обрабатываем последнюю выбранную в календаре дату
					if (dateText!=""){
						//используем, чтобы создать копию объекта, изменения которой не повлекут изменения копируемого объекта 
						var copyElem = jQuery.extend({}, events.obj[$(par).attr('class')]);
						copyElem.date = getSelectedDate(inst);
						//создаем новый объект
						events.createElem(copyElem);
						//подсветим кнопку "Сохранить изменения" красным цветом
						$('body').trigger("changeColorButton");
						//обновим список событий на странице
						$('#todos').html(events.showEvents());
						//показываем пользователю сообщение, что событие успешно скопировано
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
			//открыли календарь, чтобы пользователь мог выбрать дату
			$("#datepickerCopy").datepicker( "show" );
		}
	});	
	
	//копирование всех элементов на странице (т.е. за определенную дату)
	$('body').on('click','#copyAll', function(){
		//обрабатываем также ситуацию, когда пользователь снял часть галок и при нажатии на copyAll нужно, чтобы остальные тоже снялись 
		if ($('input[id="copyAll"]').is(':checked')){
			//получим список чекбоксов (input-ов)
			var copyList = $('body .copy');
			var copyListLength = copyList.length; 
			//для каждого из чекбоксов
			for (var i = 0; i<copyListLength; i++){
				//проверим не было ли событие удалено с помощью проверки стиля ячейки (td)
				if ($(copyList[i]).parent().css('text-decoration') != "line-through")
					//если не удалено - выберем его
					$(copyList[i]).prop('checked', true);
			};
		}
		else 
			$('body .copy').prop('checked', false);	
		var th = $(this).parent();//тут родительский th чекбокса copyAll 
		if ($('body #copyAll').is(':checked') && $("body #but").length==0){
			//добавили к чекбоксу кнопку для выбора даты
			$(th).append(' <input type="input" id="pickDate" class="datepicker"/><button id="but" type="button" class="btn btn-success btn-xs">Выберите дату</button>');		
		}
		else {//удалили календарь и кнопку
			$('#pickDate').remove();
			$('#but').remove();			
		}
		//обработка нажатия на кнопку "Выберите дату"
		$('body').on('click','#but', function(){
			//свойства и методы календаря
			$('#pickDate').datepicker({
				dateFormat: "dd-mm-yy",
				onSelect: function (dateText, inst) {
					inst.inline = true;
				},
				onClose: function(dateText, inst){
					//в паре с указанным в onSelect "inst.inline = true;" предотвращает закрытие календаря после выбора первой даты
					inst.inline = false;
					//обрабатываем последнюю выбранную в календаре дату
					if (dateText != ""){
						//получили список строк (td), которые выбраны для копирования 
						var copyList = $('input[class="copy"]:checked').parent().parent();
						var copyListLength = copyList.length;  
						if (copyListLength>0){
							var i = 0;
							while (i < copyListLength){
								//используем, чтобы создать копию элемента массива, изменения которой не повлекут изменения копируемого элемента 
								var copyElem = jQuery.extend({}, events.obj[copyList[i].className]);
								copyElem.date = getSelectedDate(inst);
								events.createElem(copyElem);								
								i++;
							}
							//подсветим кнопку "Сохранить изменения" красным цветом
							$('body').trigger("changeColorButton");
							//показываем пользователю сообщение, что события успешно скопированы
							$('#alert').html("</br>Сделаны копии <b>" + dateText + "</b>");				
							$('#alert').fadeIn().delay(1500).fadeOut();				
						}
						//обновим список событий на странице
						$('#todos').html(events.showEvents());
					}
				}
			});			
			//открыли календарь, чтобы пользователь мог выбрать дату
			$("#pickDate").datepicker( "show" );			
		});		
	});	
	
	//редактирование поля "Описание" таблицы 
	$('body').on('click','#todos .desc', function(e){
		//checkClick вернет предка поля Описание (tr (td->tr)), который в атрибуте class содержит id редактируемого объекта, или вернет false если событие было удалено либо клик был по уже редактируемому пользователем полю (по input)
		var par = checkClick(e, 'input', $(this));
		if (!par)
			return false;
		//получаем содержимое ячейки
		var oldVal = $(this).html();
		//удаляем содержимое ячейки, вставляем в нее сформированное поле
		$(this).empty().append('<input type="text" id="edit" value="'+oldVal+'" />');
		var that = $(this);
		//устанавливаем фокус на это новое поле
		$('#edit').focus();
		$('#edit').blur(function()	{
			//получаем то, что находится в поле при снятии фокуса
			var newVal = $(this).val();
			//находим ячейку, удаляем устаревшее содержимое и вставляем значение из поля
			that.empty().html(newVal);
			//если новое значение не равно прежнему
			if (newVal != oldVal) {
				//отредактируем соответсвующий объект
				events.editElem($(par).attr('class'), "description", newVal);
				//и подсветим кнопку "Сохранить изменения" красным
				$('body').trigger("changeColorButton");			
			}			
		});
	});
	//редактирование поля "Категория" таблицы 
	$('body').on('click','#todos .category', function(e){
		var par = checkClick(e, 'select', $(this));
		if (!par)
			return false;
		var oldVal = $(this).html();
		//uniqueID нужен, чтобы в случае редактирования категорий у нескольких событий на странице on change вызывался только для того, которое в настоящий момент редактируется
		var uniqueID = "edit"+$(par).attr('class');
		$(this).empty().html('<select id="'+uniqueID+'">'+categories.createCategories(oldVal)+' </select>');
		uniqueID = '#'+uniqueID;
		var that = $(this);
		$(uniqueID).focus();
		/*почти одинаковые обработчики handler для change и blur нужны т.к. в Chrome без них при изменении категории срабатывает change, потом blur, а в IE и FF только change. При этом возникают проблемы, если пользователь только кликнул по полю, но не стал менять значение (клинкул по пустом полю)*/		
		var handler = function(whatOff){
			var newVal = $(this).val();
			var new_id_category = $(this).find("option:contains("+newVal+")")[0]['id'];
			if (newVal != oldVal) {
				events.editElem($(par).attr('class'), "category", newVal);
				events.editElem($(par).attr('class'), "id_category", new_id_category);
				$('body').trigger("changeColorButton");			
			}			
			//если список категорий еще существует, заменим его на новое выбранное значение и отключим срабатываение второго обработчика
			if ($(this).is(uniqueID)) {
				$("body").off( whatOff.data.ev, uniqueID);
				that.children().remove();
				that.html(newVal);			
			}
		};
		$('body').on('change', uniqueID, {ev:'blur'}, handler);
		$('body').on('blur', uniqueID, {ev:'change'}, handler);
	});
	
	//редактирование поля "Время" таблицы 
	$('body').on('click','#todos .time', function(e){
		var par = checkClick(e, 'select', $(this));
		if (!par)
			return false;
		var checkClickOption = checkClick(e, 'option', $(this));
		if (!checkClickOption)
			return false;		
		//запомнили прежние значения
		var Hours = $(this).html().substring(0,2);
		var Minutes = $(this).html().substring(3);
		var idHours = "editHours"+$(par).attr('class');
		var idMinutes = "editMinutes"+$(par).attr('class');
		//код для вывода select с часами
		var codeHours = '<select id="'+idHours+'">'+createOptions(24, 1)+'</select>';
		//select инициализируется ранее выбранными часами 
		codeHours = codeHours.replace(">"+Hours,' selected>'+Hours);
		idHours = '#'+idHours;
		//код для вывода select с минутами
		var codeMinutes = '<select id="'+idMinutes+'">'+createOptions (60, 5)+'</select>';
		//select инициализируется ранее выбранными минутами 
		codeMinutes = codeMinutes.replace('>'+Minutes,' selected>'+Minutes);
		idMinutes = '#' + idMinutes;
		$(this).empty().html(codeHours+codeMinutes);
		$(idHours).focus();
		var hoursWereChanged = false;

		/*change нужны при изменении значений, blur - если кликнули, но передумали менять*/
		$('body').on('change blur', idHours, function(){
			//если часы изменились
			if (Hours != $(this).val()) {
				Hours = $(this).val();
				events.editElem($(par).attr('class'), "hours", +Hours);
				$('body').trigger("changeColorButton");			
			}
			hoursWereChanged = true;
		});
		$('body').on('change blur', idMinutes, function(){
			//если минуты изменились
			if (Minutes != $(this).val()) {
				Minutes = $(this).val();
				events.editElem($(par).attr('class'), "minutes", +Minutes);
				$('body').trigger("changeColorButton");			
			}
			$('#todos').html(events.showEvents());
			$(document).off('mouseup');
		});					

		$(document).on('mouseup', function (e){ // событие клика
			var elem = $(idMinutes); // тут указываем элемент
			var h = $(idHours);						
			if (elem.is(e.target) || elem.children().is(e.target)) { // если клик был по указанному элементу или его потомкам (опциям)			
				$(idMinutes).focus();
			}
			//если уже меняли часы и клик был не по часам или их потомкам
			else if (hoursWereChanged && !(h.is(e.target) || h.children().is(e.target))){		
				$('#todos').html(events.showEvents());
				/* Обязательно убиваем тут обработчик: "Для неоднократно динамически-подгружаемых скриптов" нужно использовать off*/
				$(document).off('mouseup');
			}
		});
		//сохранение изменений при выходе из полей по нажатию Enter 
		$(window).keydown(function(event){
			//ловим событие нажатия клавиши
			if(event.keyCode == 13) {//если это Enter
				$(idHours).blur();	
				$(idMinutes).blur();
			}
		});
		
	});

	//редактирование поля "Дата" таблицы 
	$('body').on('click','#todos .date', function(e){
		var par = checkClick(e, 'input', $(this));
		if (!par)
			return false;
		var val = $(this).html();
		var that = $(this);
		that.empty().append('<input id="datepickerTable" type="text">');
		$('#datepickerTable').datepicker({
			dateFormat: "dd-mm-yy",
			onSelect: function (dateText, inst) {
				inst.inline = true;
			},
			onClose: function(dateText, inst){
				inst.inline = false;
				// если dateText не пуста, значит, пользователь выбрал какую-то дату; после && сравниваем выбранную dateText (преобразовав из формата дд-мм-гггг в дд.мм.гггг) с ранее установленной val 
				if (dateText!="" && dateText.replace( /-/g, "." ) != val){
					events.editElem($(par).attr('class'), "date", getSelectedDate(inst));
					setTimeout(function(){$('#todos').html(events.showEvents())}, 2000);			
					//если в календаре выбрали дату, показываем сообщение
					that.empty().html("Новая дата события: <b>" + dateText + "</b>");
					$('body').trigger("changeColorButton");			
				} else 	
					//если открыли и закрыли календарь, не изменяя даты, убираем input и возвращаем прежнее значение
					that.empty().html(val);				
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
			$('#edit').blur();
			$("#pickDate").datepicker( "hide" );          
		//	$(document).off('mouseup');
		}
	});

	//Дочерний конструктор для событий
	function Events (){
		EventsParent.apply(this, arguments);
	}
	//Наследование свойств и методов родительского конструктора (определен в файле proto.js) 
	Events.prototype = Object.create(EventsParent.prototype);
	Events.prototype.constructor = Events;

	//Методы дочернего конструктора событий
	
	//получает объект с событиями из БД
	Events.prototype.getEvents = function (){
		var self = this;
		// пробуем получить объект с событиями из БД
		item.updateType = 'get';
		this.getEventsFormDB(ajaxObject, item)//когда ожидаем только один promise, можно обойтись без when 
			.then( function(){
				//выводим полученные события на экран
				$('#todos').html(self.showEvents());
			}); 		
	};
	
	//создает новый объект-событие в объекте obj
	Events.prototype.createElem = function(item){
		var tmpID;
		do {
			/*Максимальное целое в js = 2^53-1, но в MySQL под int, в котором храним id, выделено всего 11 разрядов => числовая константа для рандома будет 99 999 999 999*/
			tmpID = Math.floor(Math.random() * (99999999999 + 1));
			/*Проверка не существует ли такого же номера*/
		} while (tmpID in this.obj)
		item.updateType = "add";
		this.obj[tmpID] = item;
	};
	
	//редактирует свойства объекта-события	из объекта obj
	Events.prototype.editElem = function (idElem, attribute, value){
		//ищем номер элемента, который редактируем, и присваиваем редактируемому атрибуту новое значение
		this.obj[idElem][attribute] = value;
		//если элемент добавленный или уже обновленный, то оставим как было, иначе
		if (this.obj[idElem].updateType === "")
			this.obj[idElem].updateType = "upd";
	};
	
	//присваивает свойству wasDeleted объекта-события значение true или false	
	Events.prototype.delElem = function (idElem, attribute, value){
			this.obj[idElem][attribute] = value;
	}

	//сортирует события для вывода на страницу	
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
		
	//формирует и выводит на страницу таблицу "Список событий за выбранную дату"  			
	Events.prototype.showEvents = function(){
		var tmpArr = [],
			pickedDate = item.date;
		//сформируем массив с событиями за выбранную дату (массив удобнее сортировать)	
		for (var i in this.obj){
			//если дата события совпадает с определенной в календаре формы newEvent и событие не отмечено на удаление
			if (this.obj[i].date.toDateString() == pickedDate.toDateString() && !this.obj[i].wasDeleted) {
				var tmpElem = jQuery.extend({}, this.obj[i]);
				tmpElem.id = i;
				tmpArr.push(tmpElem);
			}
		}		
		//отсортируем события по времени и описанию
		tmpArr.sort(this.sortArr);
		//наименования столбцов таблицы
		var headArr = ['Дата', 'Время', 'Описание', 'Категория', "<input id='copyAll' type='checkbox'> Копировать","<input id='cleanAll' type='checkbox'> Удалить"];
		//создали пустой каркас таблицы
		var table = createEmptyTable(headArr);
		var tbody = table.children()[1];
		var counter = 0, row;
		var options = {
					year: 'numeric',
					month: '2-digit',
					day: 'numeric',
			};
		//создали строки таблицы	
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
		//если не создано ни одной строки
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
	
	//создает список опций для категорий
	Categories.prototype.createCategories = function (){
		var text = ""; 
		//перебираем все категории и создаем под них options
		for (var i in this.obj) {
			if ((this.obj[i]['category'] == item.category) || (this.obj[i]['selected']==1 && item.category==""))
				text += "<option id ='"+i+"' value='" + this.obj[i]['category'] + "' selected>" + this.obj[i]['category'] + "</option>";	
			else
				text += "<option id ='"+i+"' value='" + this.obj[i]['category'] + "'>" + this.obj[i]['category'] + "</option>";	
		}
		return text;
	}
	
	//выводит список категорий на страницу	
	Categories.prototype.showCategories = function (){
		var listOfCategories = this.createCategories();
		//если пользователь удалил все категории
		if ( listOfCategories == "")
			//спрячем поле для вывода категорий
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
	
	//проверяет, есть ли новые, измененные или удаленные события, отправляет их серверу и обрабатывает ответ
	AjaxRequest.prototype.saveChanges = function (obj){
		var self = this;
		var listToServer = {};
		//выбираем добавленные/удаленные/измененные события
		for (var i in obj){
			//если событие отмечено на уделение - добавим соответсвующий updType
			if (obj[i].wasDeleted){
				obj[i].updateType = obj[i].updateType+"del";
				listToServer[i]=obj[i];
				continue;
			}
			//если событие добавлено или изменено
			if (obj[i].updateType != "" && obj[i].updateType != undefined){
				listToServer[i]=obj[i];
			}
		};
		//только если были какие-то изменения, делаем запрос к серверу 
		if (!isEmpty(listToServer)){
			//подготовим объект для передачи серверу
			//разница во времени со временем по Гринвичу, чтобы записать в БД верную дату
			var timeDifference = -1*(new Date().getTimezoneOffset());
			//строка для обработки сервером 
			var json_string = timeDifference+"|"+ JSON.stringify(listToServer);
			self.requestData(self.dataUrl, "updEvents", json_string).then(
				function (response) {
					//обработка ответа сервера (функция responseHandler описана в файле proto.js)
					response = self.responseHandler(response);
					if (response){
						for (var i in obj){
							//удаляем элемент только если он был успешно удален на сервере 
							if (obj[i].wasDeleted){
								delete obj[i];						
								continue;
							}
							//присвоим новым объектам уникальные номера из БД
							if (obj[i].updateType == "add")
								obj[i].db_id = response[i].db_id;							
							obj[i].updateType = "";
						}
					}
				},
				/*если из-за ошибки мы не можем обновить данные на сервере, значит, нужно временно запретить пользователю дальнейшую работу, пока ошибка не будет исправлена*/
				function (error) {
					self.showErrorPage(error);
				}
			);			
		}
		return obj;
	}
	//объект, в который записываются все полученные из БД события-объекты, и производятся последующие изменения, добавления и удаления событий-объектов 
	var events = new Events ();
	//объект, в который записываются все полученные из БД категории пользователя
	var categories = new Categories ();	
	//объект для организации ajax-запросов
	var ajaxObject = new AjaxRequest ();	
	
	//вызывается сразу после получения контента страницы с сервера (триггер loadToday срабатывает в файле init.js)
	$('body').on('loadToday','#data', function(){
		//инициализация user_id, чтобы выгрузки и все изменения БД производились именно для этого пользователя
		item.user_id = userID;
		//получим список событий из БД и выведем его на экран
		events.getEvents();
		//получим список категорий из БД
		categories.requestToDB(ajaxObject, 'getCategories', null);
		//созадние в форме newEvent календаря
		$('#datepicker').datepicker({ 
			dateFormat: 'dd-mm-yy', 
			//при закрытии календаря
			onClose: function (dateText, inst) {				
				//если выбрана новая дата 
				if (item.date.setHours(0,0,0,0) != getSelectedDate(inst).setHours(0,0,0,0)) {
					//если кнопка "Сохранить изменения" красная т.е. пользователь что-то менял
					if ($('body #refresh').is('.btn-danger')) {
						var confirmSaveChanges = confirm("Смена даты без сохранения приведет к потере сделанных изменений. Сохранить изменения?");
						//если согласился сохранить изменения
						if (confirmSaveChanges)
							$('body #refresh').click();
						else 
							//подсветим кнопку "Сохранить изменения" голубым цветом
							$('body #refresh').removeClass('btn-danger').addClass('btn-info');			
					}
					item.date = getSelectedDate(inst);
					//получили и вывели данные за новую выбранную дату
					events.getEvents();	
				}
			}
		}).on("keydown", function(e){ //закрытие календаря по нажатию на Enter 
			if (e.which == 13) {
				 e.preventDefault();
				$("#datepicker").datepicker( "hide" );          
			}
		});
		//инициализация элементов формы newEvent при загрузке страницы
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
	//Когда пользователь нажмет на кнопку будт удалены события за все даты(в том числе из БД)
	$('body').on('click','#clear', function(e){
		var confirmDelete = confirm("Вы подтверждаете удаление записей о событиях за все даты?");
		if (confirmDelete) {			
			var json_string = "0|"+ JSON.stringify({t:{updateType: "delAll", user_id: userID}});
			//запрос к серверу на удаление всех событий пользователя из БД
			ajaxObject.requestData(ajaxObject.dataUrl, "updEvents", json_string).then(
				function (response) {
					events.obj = {};
					$('#todos').html(events.showEvents());
					alert("Все события успешно удалены");
				},
				/*если из-за ошибки мы не можем обновить данные на сервере, значит, нужно временно запретить пользователю дальнейшую работу, пока ошибка не будет исправлена*/
				function (error) {
					ajaxObject.showErrorPage(error);
				});
		}
        return false;
    });
});
