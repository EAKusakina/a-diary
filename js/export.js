//Функционал на странице "Эспорт событий в Microsoft Excel"

$(document).ready(function() {
	
	//обработка нажатия на кнопку "Выгрузить в Excel"
	$('body').on('submit','#exportForm', function(e){
		e.preventDefault();
		firstDate.setHours(0,0,0,0);
		secondDate.setHours(23,59,59,0);
		//если дата начала больше даты окончания, поменяем даты местами
		if (firstDate > secondDate) {
			var tmp = firstDate;
			firstDate = secondDate;
			firstDate.setHours(0,0,0,0);
			secondDate = tmp;
			secondDate.setHours(23,59,59,0);
		}
		//сохраним события, даты которых попали в выбранный пользователем период, в массив (его удобнее сортировать)	
		var tmpArr = [];
		for (var i in eventObj.obj){
			if (eventObj.obj[i].date >= firstDate && eventObj.obj[i].date <= secondDate){
				var tmpElem = jQuery.extend({}, eventObj.obj[i]);
				tmpElem.id = i;
				tmpArr.push(tmpElem);
			}
		}
		//отсортируем события по дате и времени
		tmpArr.sort(function (a, b){
			/*При сравнении дат в JavaScript необходимо иметь в виду, что оператор == возвращает значение true, только если даты с его обеих сторон относятся к одному и тому же объекту.  Поэтому при наличии двух отдельных объектов Date, для которых задана одна и та же дата, оператор date1 == date2 возвращает значение false. 
			Поэтому для сравнения дат на равенство используем их строковые представления */
			var aDate = a.date.toDateString();
			var bDate = b.date.toDateString();
			
			switch (aDate == bDate) {
				case true:
					switch (a.hours == b.hours) {
						case true:
							if (a.minutes > b.minutes) 
								return 1;
							else 
								return -1;
						case false:
							if (a.hours > b.hours)
								return 1;
							else 
								return -1;							
					}
				case false:
					if (a.date > b.date)
						return 1;
					else 
						return -1;							
			}
		});
		//создадим таблицу, которая будет выводиться в файл
		var headArr = ['Дата', 'Время', 'Описание', 'Категория'];
		var table = createEmptyTable(headArr);
		var tbody = table.children()[1];
		var counter = 0, row;
		var options = {
					year: 'numeric',
					month: '2-digit',
					day: 'numeric',
			};
		tmpArr.forEach(function(item){
			row = $('<tr></tr>').appendTo(tbody);
			var date = item.date.toLocaleString("ru", options);
			var h = (item.hours < 10) ? "0" + item.hours : item.hours;
			var m = (item.minutes < 10) ? "0" + item.minutes : item.minutes;
			$('<td></td>').html(date).appendTo(row); 
			$('<td></td>').html(h + ":" + m).appendTo(row); 
			$('<td></td>').html(item.description).appendTo(row); 
			$('<td></td>').html(item.category).appendTo(row); 
			counter++;		 			
		});	
		if (counter == 0){
			row = $('<tr></tr>').appendTo(tbody);
			$('<td></td>').html("<b>Нет данных за выбранные даты</b>").appendTo(row); 
		}
		//вывод в тектовый файл и открытие его с помощью Excel
		/*Internet Media Types[1] — типы данных, которые могут быть переданы посредством сети интернет с применением стандарта MIME. 
		Вендорные файлы включают в себя и:
			application/vnd.ms-excel (Excel-файлы типа BIFF) 
			application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (Excel-файлы с версии Excel 2007 и выше)
		The Excel file format is named BIFF (Binary Interchange File Format). It is used to store all types of documents: worksheet documents, workbook documents , and workspace documents . There are different versions of this file format, depending on the version of Excel that has written the file, and depending on the document type.
		*/

		var ua = window.navigator.userAgent;
        var msie = ua.indexOf("MSIE "); 

		//если браузер - IE 
        if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
			$('#data').append('<iframe id="txtArea1" style="display:none"></iframe>');			
			txtArea1.document.open("txt/html","replace");
			txtArea1.document.write('<table>'+table.html()+'</table>');
			txtArea1.document.close();
			txtArea1.focus(); 
			sa=txtArea1.document.execCommand("SaveAs",true,"List of events.xls");
         } else 
			//не работает в IE 
			window.open('data:application/vnd.ms-excel,' + '\uFEFF' + encodeURIComponent('<table>'+table.html()+'</table>'));	
	});

	//Дочерний конструктор для событий
	function Events (){
		EventsParent.apply(this, arguments);
	}
	//Наследование свойств и методов родительского конструктора (определен в файле proto.js) 
	Events.prototype = Object.create(EventsParent.prototype);
	Events.prototype.constructor = Events;

	//объект, в который записываются все полученные из БД события-объекты
	var eventObj = new Events();
	//объект для организации ajax-запросов
	var ajaxObject = new AjaxRequestParent();
	//даты начала и окончания периода, за который производится выборка данных
	var firstDate, secondDate;

	//вызывается сразу после получения контента страницы с сервера (триггер export срабатывает в файле init.js)
	$('body').on('export','#data', function(){
		//загрузили список событий из БД
		eventObj.getEventsFormDB(ajaxObject, {updateType: "getAll", user_id: userID})
			/*инициализация переменных firstDate, secondDate и календарей*/
			.then( function(){		
				//если список событий пустой  -  возвращаем сегодняшнюю дату
				if (isEmpty(eventObj.obj)) {
					//т.к. Date() устанавливает текущую дату и текущее время(т.е. время когда выполнялся скрипт, а не 00:00), нужно отдельно инициализировать время, чтобы сравнение по дате было корректным
					firstDate = new Date();
					secondDate = new Date();					
				} else {					
					//иначе проходим по всему списку событий, отыскивая событие с наименьшей датой
					var minDate = new Date(5099,01,01),
						maxDate = new Date(00,01,01);
					for (var i in eventObj.obj ){
						if (eventObj.obj[i].date < minDate){
							minDate = eventObj.obj[i].date;
						}
						if (eventObj.obj[i].date > maxDate){
							maxDate = eventObj.obj[i].date;
						}						
					}
					firstDate = new Date (minDate);
					secondDate = new Date (maxDate);
				}
					
				//дата самой ранней записи, сделанной пользователем 
				$('#datepicker1').datepicker('setDate', firstDate);
				
				//дата самой поздней записи, сделанной пользователем 
				$('#datepicker2').datepicker('setDate', secondDate);
			}); 			
		//календарь для выбора даты начала периода 
		$('#datepicker1').datepicker({ 
			dateFormat: 'dd-mm-yy', 
			onSelect: function (dateText, inst) {
				firstDate = getSelectedDate(inst);
				/*если удалить все из поля ввода или набрать там бессмысленный набор цифр, то будет использоваться последняя выбранная дата либо сегодняшняя дата*/
			},
		});
		//календарь для выбора даты окончания периода 
		$('#datepicker2').datepicker({ 
			dateFormat: 'dd-mm-yy', 
			onSelect: function (dateText, inst) {
				secondDate = getSelectedDate(inst);
			}
		});		
		

	});

});
