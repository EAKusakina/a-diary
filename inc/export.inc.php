<?php 
if($ajax) {
  echo '<section class="personalPage">
  	<h1>Эспорт событий в Microsoft Excel</h1>

    <form id="form" action="#" method="POST">
	<div class="row">	
		<div class="col-md-3">
			<label class="control-label" for="datepicker1">Начало периода</label>
			<div class="input-group">
				<span class="input-group-addon"><i class="glyphicon glyphicon-calendar"></i></span>
				<input id="datepicker1" type="text" class="form-control">
			</div>
		</div>
		<div class="col-md-3">
			<label class="control-label" for="datepicker2">Окончание периода</label>
			<div class="input-group">
				<span class="input-group-addon"><i class="glyphicon glyphicon-calendar"></i></span>
				<input id="datepicker2" type="text" class="form-control">
			</div>
		</div>
		<div class="col-md-3">
			<div id = "parent">
				<div id = "child">
					<input id="getFile" type="submit" value="Выгрузить в Excel" class="btn btn-primary"/>
				</div>
			</div>
		</div>
    </div>
	</form>	
</section>';
} else{
  include '../inc/index.inc.php';
}

