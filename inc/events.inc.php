<?php 
if($ajax) {
  echo '<section class="personalPage">
	<h1>Создание, редактирование и удаление событий</h1>

    <form id="form" action="#" method="POST">
	<div class="row">	
		<div class="col-md-2 col-sm-4">
			<label class="control-label" for="datepicker">Дата</label>
			<div class="input-group">
				<span class="input-group-addon"><i class="glyphicon glyphicon-calendar"></i></span>
				<input id="datepicker" type="text" class="form-control">
			</div>
		</div>
		<div class="col-md-2 col-sm-6">
			<label class="control-label">Время</label>
			<div class = "input-group">	
				<div class="input-group-btn">
				<select id="hours" name="hours" class="btn btn-default dropdown-toggle">
					<option value="00">00</option>
					<option value="01">01</option>
					<option value="02">02</option>
					<option value="03">03</option>
					<option value="04">04</option>
					<option value="05">05</option>
					<option value="06">06</option>
					<option value="07">07</option>
					<option value="08">08</option>
					<option value="09">09</option>
					<option value="10">10</option>
					<option value="11">11</option>
					<option value="12">12</option>
					<option value="13">13</option>
					<option value="14">14</option>
					<option value="15">15</option>
					<option value="16">16</option>
					<option value="17">17</option>
					<option value="18">18</option>
					<option value="19">19</option>
					<option value="20">20</option>
					<option value="21">21</option>
					<option value="22">22</option>
					<option value="23">23</option>		
				</select>
				<span class="btn btn-default"  disabled="disabled">:</span>
				<select id="minutes" name="minutes" class="btn btn-default dropdown-toggle">
					<option value="00">00</option>
					<option value="05">05</option>
					<option value="10">10</option>
					<option value="15">15</option>
					<option value="20">20</option>
					<option value="25">25</option>
					<option value="30">30</option>
					<option value="35">35</option>
					<option value="40">40</option>
					<option value="45">45</option>
					<option value="50">50</option>
					<option value="55">55</option>
				</select>
				</div>
			</div>
		</div>
		<div class="col-md-3 col-sm-6">
			<div class = "input-group">	
				<label class="control-label" for="description">Описание события</label>
				<input id="description" name="description" type="text" class = "form-control"/>
			</div>
		</div>
		<div class="col-md-2 col-sm-2">
				<label class="control-label" for="category">Категория</label>
			<div class="input-group-btn">
				<select id="category" name="category" class="btn btn-default dropdown-toggle"> </select>
			</div>
		</div>
		<div class="col-md-2 col-sm-6">
			<div id = "parent">
				<div id = "child">
					<input id="add" type="submit" value="Добавить событие" class="btn btn-primary"/>
				</div>
			</div>
		</div>
		<div class="col-md-6" id="alert"></div>
    </div>
	</form>
	<div class="row">
		<div class="col-md-5 col-sm-7">
			<h2 class = "mar">Список событий за выбранную дату</h2>
		</div>
		<div class="col-md-2 col-sm-2 col-sm-offset-1 mar">
			<input id="refresh" type="submit" value="Обновить список" class="btn btn-info"/>
		</div>
	</div>
    <div id="todos" class="col-md-12 table-responsive"></div>
	<div class="row">
		<div class="col-md-12 mar">
			<button id="clear" class = "btn btn-default">Удалить события за все даты</button>
		</div>
	</div>
</section>';
} else{
  include '../inc/index.inc.php';
}