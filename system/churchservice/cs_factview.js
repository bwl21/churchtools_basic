(function($) {

// Constructor
function FactView() {
  ListView.call(this);
  this.name="FactView";
  this.currentDate=new Date();
  this.currentDate=this.currentDate.toStringDe(false).toDateDe(false);
  this.factLoaded=false;
  this.allDataLoaded=false;
}

Temp.prototype = ListView.prototype;
FactView.prototype = new Temp();
factView = new FactView();


FactView.prototype.renderMenu = function() {
  this_object=this;

  menu = new CC_Menu("Men&uuml;");

  if (masterData.auth.write)
    menu.addEntry("Neues Event anlegen", "anewentry", "star");
  if (masterData.auth.exportfacts)
    menu.addEntry("Fakten exportieren", "aexport", "share");
  menu.addEntry("Hilfe", "ahelp", "question-sign");

  if (!menu.renderDiv("cdb_menu",churchcore_handyformat()))
    $("#cdb_menu").hide();
  else {
    $("#cdb_menu a").click(function () {
      if ($(this).attr("id")=="anewentry") {
        this_object.renderAddEntry();
      }
      else if ($(this).attr("id")=="aexport") {
        churchcore_openNewWindow("?q=churchservice/exportfacts");
      }
      else if ($(this).attr("id")=="ahelp") {
        churchcore_openNewWindow("http://intern.churchtools.de/?q=help&doc=ChurchService");
      }
      return false;
    });
  }
};


FactView.prototype.getCountCols = function() {
  return 2;
};

FactView.prototype.groupingFunction = function (event) {
  var tagDatum=event.startdate.toDateEn(false).toStringDe();
  var merker = new Object;
  $.each(allEvents, function(k,a) {
    if (a.startdate.toDateEn(false).toStringDe()==tagDatum) {
      if (a.facts!=null)
        $.each(a.facts, function(i,b) {
          if (merker[i]==null) merker[i]=0;
          merker[i]=merker[i]+b.value*1;
        });
    }
  });
  var txt=event.startdate.toDateEn(false).getDayInText()+", "+event.startdate.toDateEn(false).toStringDe();

  $.each(churchcore_sortMasterData(masterData.fact), function(k,a) {
    txt=txt+'<td class="grouping">';
    if (merker[a.id]!=null)
      txt=txt+merker[a.id];
  });
  return txt;
};

function _processInputFact() {
  var event_id=$("#inputFact").parents("td.editable").attr("event_id");
  var fact_id=$("#inputFact").parents("td.editable").attr("fact_id");
  if ((event_id!=null) && ($("#inputFact").val()!=null)) {
    if (!($("#inputFact").val().replace(",",".")>=0)) {
      alert("Wert muss >=0 sein!");
      $("#inputFact").focus();
      return false;
    }
    if (allEvents[event_id].facts==null)
      allEvents[event_id].facts=new Object();
    var o = new Object();
    o.fact_id=fact_id;
    o.value=$("#inputFact").val().replace(",",".");
    churchInterface.jsendWrite({func:"saveFact",event_id:event_id,fact_id:fact_id,value:o.value}, function(ok, data) {
      if (!ok) alert("Fehler beim Speichern: "+data);
      else {
        allEvents[event_id].facts[fact_id]=o;
        $("#inputFact").parent().html(o.value);
      }  
    });
  }
  return true;
}

FactView.prototype.addFurtherListCallbacks = function() {
  var t=this;
  
  if (masterData.auth.editfacts) {
  
    $("td.editable").hover(function() {
        $(this).addClass("active");
      },
      function() {
        $(this).removeClass("active");
      }
    );
  
  
    $("td.editable").click(function(k) {
  
      // Wenn der Wert in Ordnung ist bzw. kein Wert da ist
      if (_processInputFact(event_id, fact_id)) {
        var event_id=$(this).attr("event_id");
        var fact_id=$(this).attr("fact_id");
        var _value="";
        if ((event_id!=null) && (allEvents[event_id].facts!=null) && (allEvents[event_id].facts[fact_id]!=null)) {
          _value=allEvents[event_id].facts[fact_id].value;
        }
        $(this).html(form_renderInput({value:_value, type:"mini", cssid:"inputFact"}));
        $("#inputFact").focus();
        $('#inputFact').keyup(function(e) {
          // Enter
          if (e.keyCode == 13) {
            _processInputFact(event_id, fact_id);
          }
          // Escape
          else if (e.keyCode == 27) {
            var event_id=$("#inputFact").parents("td.editable").attr("event_id");
            var fact_id=$("#inputFact").parents("td.editable").attr("fact_id");
            if ((allEvents[event_id].facts!=null) && (allEvents[event_id].facts[fact_id]!=null))
              $("#inputFact").parent().html(allEvents[event_id].facts[fact_id].value);
            else
              $("#inputFact").remove();
          }
        });
      }
    });
  }
};

FactView.prototype.getListHeader = function () {
  var this_object=this;
  
  if ((masterData.settings.filterCategory=="") || (masterData.settings.filterCategory==null))
    delete masterData.settings.filterCategory;
  if (this.filter["filterKategorien"]==null) {
    this_object.makeFilterCategories(masterData.settings.filterCategory);
    this.filter["filterKategorien"].setSelectedAsArrayString(masterData.settings.filterCategory);
  }
  this.filter["filterKategorien"].render2Div("filterKategorien", {label:"Kategorien"});

  if ((!this.factLoaded) && (this.allDataLoaded)) {
    var elem = this.showDialog("Lade Faktendaten", "Lade Faktendaten...", 300,300);
    cs_loadFacts(function() {
      this_object.factLoaded=true;
      elem.dialog("close");
      this_object.renderList();
    });
  }
  var rows = new Array();
  if (masterData.settings.listViewTableHeight==0)
    factView.listViewTableHeight=null;
  else
    factView.listViewTableHeight=665;

  rows.push('<th>Events');
  $.each(churchcore_sortData(masterData.fact,"sortkey"), function(k,a){
    rows.push('<th>'+a.bezeichnung);
  });

  return rows.join("");
};

FactView.prototype.renderListEntry = function (event) {
  var rows = new Array();
  var width=100/(1+churchcore_countObjectElements(masterData.fact));
  rows.push('<td width="'+width+'%">' + event.startdate.toDateEn(true).toStringDeTime(true)+" "+event.bezeichnung);
  if (event.special!=null) {
    rows.push("<div class=\"event_info\">"+event.special.htmlize()+"</div>");
  }
  var cl="";
  if (masterData.auth.editfacts) cl="editable";
  $.each(churchcore_sortData(masterData.fact,"sortkey"), function(k,a) {
    rows.push('<td width="'+width+'%" class="'+cl+'" event_id="'+event.id+'" fact_id="'+a.id+'">');
    if ((event.facts!=null) && (event.facts[a.id]!=null))
      rows.push(event.facts[a.id].value);
    else (rows.push(""));
  });


  return rows.join("");
};

FactView.prototype.messageReceiver = function(message, args) {
  var this_object = this;
  if (message=="allDataLoaded")
    this.allDataLoaded=true;
  if (this==churchInterface.getCurrentView()) {
    if (message=="allDataLoaded") {
      this_object.renderList();
    }
  }
};

FactView.prototype.addSecondMenu = function() {
  return '';

};


})(jQuery);
