//Функционал на странице "Создание, редактирование и удаление категорий"

$(document).ready(function() {

	//редактирование поля "Категория" таблицы 
	$('body').on('click','#categories .category', function(e){
		var that = $(this);
		//checkClick вернет предка поля Категория (tr (td->tr)), который в атрибуте class содержит id редактируемого объекта, или вернет false если событие было удалено либо клик был по уже редактируемому пользователем полю (по input)		
		var par = checkClick(e, 'input', $(this));
		if (!par)
			return false;
		//получаем содержимое ячейки
		var oldVal = $(this).html();
		//удаляем содержимое ячейки, вставляем в нее поле для редактирования пользователем названия категории
		$(this).empty().append('<input type="text" id="edit" value="'+oldVal+'" />');
		$('button').addClass('disabled').removeClass('active');
		//устанавливаем фокус на это новое поле
		$('#edit').focus();
		$('#edit').blur(function()	{
			//получаем то, что находится в поле при снятии фокуса
			var newVal = $(this).val();
			if (newVal !== oldVal){
				//если новое значение - пустая строка или строка из одних пробелов
				if ((newVal == "") || (!/\S/.test(newVal))){
					alert("Для удаления категории поставьте галку в столбце 'Удалить'");
					that.empty().html(oldVal);
					//если до данного редактирования были какие-то еще изменения разблокируем кнопки "Сохранить изменения" и "Отменить изменения"
					if (!isEmpty(categories.updObj))
						$('button').addClass('active').removeClass('disabled');
					return false;	
				}
				categories.editObj($(par).attr('class'), 'category', newVal);
				//находим ячейку, удаляем устаревшее содержимое и вставляем введенное пользователем значение
				that.empty().html(newVal).addClass("editedField");
			}
			else 
				that.empty().html(oldVal);				
		});
	});
	
	//редактирование поля "Выбирать по умолчанию" таблицы 
	$('body').on('click','.setSelected', function(e){
		var $that = $(this); //тут чекбокс
		var td = $that.parent();//тут родительский td чекбокса 
		//если ячейка зачеркнута т.е. строка была удалена, выходим из функции
		if (td.css('text-decoration') == "line-through")
			return false;
		//получили предка: tr(input '.setSelected'->td->tr)
		var par = $that.parent().parent();
		//снимаем отметку Выбирать по умолчанию со всех категорий	
		var copyArr = $('body #categories .setSelected');
		var copyArrLength = copyArr.length;  
		for (var i = 0; i<copyArrLength; i++){
			if (copyArr[i].checked){
				//получили имя класса - номер категории
				var parentClass = copyArr[i].parentNode.parentNode.className;
				categories.editObj(parentClass, 'selected', 0);				
			}
			copyArr[i].checked = false;
		};
		//устанавливаем отметку на выбранной пользователем категории
		$that.prop('checked', true);	
		categories.editObj($(par).attr('class'), 'selected', 1);
	});	

	//удаление категории
	$('body').on('click','.delCat', function(elem){
		//получили предка: tr(input 'del'->td->tr)
		var par = $(this).parent().parent();
		//если чекбокс выбран
		if ($(this).prop('checked')){
			//проверим, не является ли эта категория выбираемой по умолчанию
			var defaultCheckbox = $(this).parent().prev().children();
			if (defaultCheckbox[0].checked){
				$(this).prop('checked', false);
				alert("Невозможно удалить категорию, которая выбирается по умолчанию. Для удаления данной категории установите другую категорию по умолчанию и затем удалите эту.");
				return;
			}
			//зачеркнем содержимое всей строки
			$(par).find('td').css('text-decoration','line-through');
			//(true=1 или false=0); если передавать просто true или false, то на сервере false воспринимается как строка и равен true, а 0 и "0" в php равны false
			categories.editObj($(par).attr('class'), 'deleted', 1);
		}
		else {
			//сделаем содержимое всей строки незачеркнутым
			$(par).find('td').css('text-decoration','none');
			categories.editObj($(par).attr('class'), 'deleted', 0);
		}	
	});	
	
	//добавление категории 
	$('body').on('click','#categories .addCat', function(e){
		var that = $(this);
		var par = checkClick(e, 'input', $(this));
		if (!par)
			return false;
		//иначе получаем содержимое ячейки
		var oldVal = $(this).html();
		//формируем код текстового поля
		var code = '<input type="text" id="edit" value="" />';
		//удаляем содержимое ячейки, вставляем в нее сформированное поле
		$(this).empty().append(code);
		$('button').addClass('disabled').removeClass('active');
		//устанавливаем фокус на это новое поле
		$('#edit').focus();
		$('#edit').blur(function()	{
			//получаем то, что находится в поле при снятии фокуса
			var newVal = $(this).val();
			//если новое значение - пустая строка или строка из одних пробелов
			if ((newVal == "") || (!/\S/.test(newVal))){
				alert("Невозможно сохранить пустую категорию");
				that.empty().html(oldVal);
				if (!isEmpty(categories.updObj))
					$('button').addClass('active').removeClass('disabled');
				return false;	
			}
			//создаем новую категорию с временным номером 
			var tmpID = "tmp_"+Math.floor(Math.random() * (99999999999 + 1));
			var tmpObj = {};
			tmpObj[tmpID] = {};
			tmpObj[tmpID]['category'] = newVal;
			tmpObj[tmpID]['selected'] = 0;	
			categories.editObj(tmpID, 'added', tmpObj[tmpID]);
			//добавили возможность изменять новую категорию
			that.empty().html(newVal).removeClass('addCat').addClass("editedField").addClass("category");
			//разблокировали возможность удалить либо выбрать по умолчанию новую категорию
			$(par).children().children().prop("disabled", false);
			//добавили к строке класс с временным номером новой категории
			$(par).addClass(tmpID);
			//добавили строку для добавления следующей категории
			$(par).after("<tr><td class = 'addCat'>Введите название категории</td><td><input class ='setSelected' disabled type='checkbox'></td><td><input class ='delCat' disabled type='checkbox'></td></tr>");
		});
	});

	//сохранение изменений по нажатию на кнопку "Сохранить изменения"
	$('body').on('click','#saveChanges', function(){
		var wereInDelete = false;
		for (var i in categories.updObj){
			//если нашли выбранную на удаление категорию
			if (categories.updObj[i]['deleted'] == 1) {
				//показываем предупреждение (даже если несколько категорий было удалено, предупреждение будет показано только 1 раз)
				if (!wereInDelete)
					var confirmDelete =	confirm("В списке категорий на изменение есть удаленная(-ые). Если категория была использована при создании событий, то после ее удаления поле 'Категория' указанных событий станет пустым. Вы подтверждаете удаление? (ОК - 'Подтверждаю', Отмена - 'Отменить удаление (остальные изменения будут сохранены)')");
				wereInDelete = true;
				//если пользователь подтвердил удаление категории(-ий) переходим к следующей категории
				if (confirmDelete)
					continue;
				//иначе удаляем из списка свойств объекта свойство deleted (если до удаления категорию редактировали, например, меняли название, данные изменения сохранятся) 
				else
					delete categories.updObj[i]['deleted'];
			}
			if (categories.updObj[i]['added'] !== undefined)
				continue;
			//если в списке объектов на изменение встретился объект, у которого название и Выбирать по умолчанию идентичны полученным первоначально с сервера
			if (categories.updObj[i]['category'] == categories.obj[i]['category'] && 
				categories.updObj[i]['selected'] == categories.obj[i]['selected'])
				//удаляем такой объект из списк объектов на изменение
				delete categories.updObj[i];
		}
		//если список объектов на изменение не пустой
		if (!isEmpty(categories.updObj))
			//отправляем его на сервер для внесения изменений в БД
			categories.requestToDB(ajaxObj,'updCategories', JSON.stringify(categories.updObj));
	});

	//сохраниение изменений по нажатию на Enter
	$(window).keydown(function(event){
		//если нажали Enter и кнопка "Сохранить изменения" есть на странице
		if(event.keyCode == 13 && $("button").is("#saveChanges") ) {	
			//и она активна
			if ($('#saveChanges').attr("class").indexOf("active")>=0) {
				event.preventDefault();
				$('#saveChanges').click();
			}
		}
	});	
	
	//отмена изменений по нажатию на кнопку "Отменить изменения"
	$('body').on('click','#cancel', function(){
		//очистили список объектов на изменение
		categories.updObj = {};
		//вывели первоначальный список категорий
		categories.showCategories();
		//заблокировали кнопки
		$('button').addClass('disabled').removeClass('active');
	});
	
	//Дочерний конструктор для категорий
	function Categories (){
		CategoriesParent.apply(this, arguments);
	}
	//Наследование свойств и методов родительского конструктора (определен в файле proto.js) 
	Categories.prototype = Object.create(CategoriesParent.prototype);
	Categories.prototype.constructor = Categories;

	//Методы дочернего конструктора для категорий - в прототип 

	//обработка добалвения/изменения/удаления категории
	Categories.prototype.editObj = function (idElem, attribute, newVal){
		//если в списке объектов на изменение еще нет объекта с таким idElem 
		if (this.updObj[idElem] == undefined)
			//создадим его
			this.updObj[idElem] = {};
		//присвоим свойству attribute редактируемого объекта значение newVal 
		this.updObj[idElem][attribute] = newVal;
		//разблокируем кнопки, чтобы пользователь мог сохранить изменения
		$('button').addClass('active').removeClass('disabled');
	};
	
	//выводит список категорий на страницу
	Categories.prototype.showCategories = function (){
		var headArr = ['Категория', 'Выбирать по умолчанию', "<input id='cleanAllCat' type='checkbox'> Удалить"];
		//создаем каркас таблицы (заголовок и пустое body)
		var table = createEmptyTable(headArr);
		var tbody = table.children()[1];
		var row;
		//для каждой категории, полученной из БД, создаем строку, содержащую
		for (var i in this.obj){
			row = $('<tr></tr>').attr({ class: i }).appendTo(tbody);
			//название категории
			$('<td></td>').attr({ class:"category"}).html(this.obj[i]['category']).appendTo(row);
			//чекбокс для столбца "Выбирать по умолчанию"
			if (this.obj[i]['selected'] == 1)
				$('<td></td>').html("<input class ='setSelected' type='checkbox' checked>").appendTo(row);
			else
				$('<td></td>').html("<input class ='setSelected' type='checkbox'>").appendTo(row);				
			//чекбокс для удаления категории
			$('<td></td>').html("<input class ='delCat' type='checkbox'>").appendTo(row); 
		}
		//создаем строку для добавления новой категории
		row = $('<tr></tr>').appendTo(tbody);
		$('<td></td>').attr({ class:"addCat"}).html('Введите название категории').appendTo(row);
		$('<td></td>').html("<input class ='setSelected' type='checkbox' disabled>").appendTo(row);				
		$('<td></td>').html("<input class ='delCat' type='checkbox' disabled>").appendTo(row); 
		$('#categories').html(table);
		//под таблицей создаем кнопки для сохранения и отмены изменений
		$('#buttons').html("<div class='col-md-2 col-md-offset-3 col-sm-2 col-sm-offset-2'><button id='saveChanges' type='submit' class='btn btn-success disabled'>Сохранить изменения</button></div><div class='col-md-3 col-sm-offset-2 col-sm-3'><button id='cancel' type='submit' class='btn btn-default disabled'>Отменить изменения</button></div>");		
	}
	var categories = new Categories ();
	var ajaxObj = new AjaxRequestParent();
	
	//вызывается сразу после получения контента страницы с сервера (триггер loadCategories срабатывает в файле init.js)
	$('body').on('loadCategories','#data', function(){
		//получаем список категорий с сервера из БД (requestToDB описана в proto.js)
		categories.requestToDB(ajaxObj, 'getCategories', null);
	});

});
