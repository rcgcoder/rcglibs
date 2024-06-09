'use strict';
class RCGDateUtils {
	isDate(value,bOnlyObject){
		var vAux=value;
		if ((isUndefined(vAux))
			 ||(vAux===null)
			 ||(vAux==="")) {
			return false;
		}
		if ((typeof value==="object")&&(value.constructor.name=="Date")) return true;
		if (vAux instanceof Date) return true;
		if (isDefined(bOnlyObject)&&bOnlyObject) return false;
		if (isString(value)){
			if (!isNaN(value)) return false;
			if (Date.parse(value)>0) return true;
			//try{vAux=new Date(value);return true;} catch(err){};
			if (value.length==19){
				try{
					vAux=toDateNormalDDMMYYYYHHMMSS(value);
					if (!isNaN(vAux.getTime())) return true;
				} catch(err){};
			}
			if (value.length==10){
				try{
						vAux=toDateNormalYYYYMMDD(value);
						if (!isNaN(vAux.getTime())) return true;
				} catch(err){};
			}
		}
		return false;
	}
	toDateNormalDDMMYYYYHHMMSS(sDate){ //dd/mm/yyyy hh:mm:ss
		//if value where a date... return it
		if ((typeof sDate==="object")&&(sDate.constructor.name=="Date")) return sDate;
		if (sDate instanceof Date) return sDate;
		var sAuxDate=replaceAll(sDate," ","");//.split(" ");
		var arrDate=sAuxDate.split("/");
		var sAuxTime=arrDate[2].substring(4,arrDate[2].length).trim();
		arrDate[2]=arrDate[2].substring(0,4);
		
	    var curr_date= parseInt(arrDate[0]);
	    var curr_month = parseInt(arrDate[1])-1;
	    var curr_year = parseInt(arrDate[2]);
	    var curr_hr= 0;
	    var curr_min = 0;
        var curr_sc= 0;
		var arrTime=sAuxTime.split(":");
		if (arrTime[0]!=""){
			curr_hr= parseInt(arrTime[0]);
		}
		if (arrTime.length>1){
			curr_min = parseInt(arrTime[1]);
		}
		if (arrTime.length>2){
			curr_sc= parseInt(arrTime[2]);
		}
		
		var dResult= new Date();
		dResult.setFullYear(curr_year, curr_month, curr_date);
		dResult.setHours(curr_hr);
		dResult.setMinutes(curr_min);
		dResult.setSeconds(curr_sc);
		dResult.setMilliseconds(0);
		return dResult;
	}

	onlyDate(date){
		var curr_year=date.getFullYear();
		var curr_month=date.getMonth();
		var curr_date=date.getDate();
	    var curr_hr= 0;
	    var curr_min = 0;
	    var curr_sc= 0;
		
		var dResult= new Date();
		dResult.setFullYear(curr_year, curr_month, curr_date);
		dResult.setHours(curr_hr);
		dResult.setMinutes(curr_min);
		dResult.setSeconds(curr_sc);
		return dResult;
	}
	
	
	isSameDay(date1,date2){
		if (date1.getFullYear()!=date2.getFullYear()) return false;
		if (date1.getMonth()!=date2.getMonth()) return false;
		if (date1.getDate()!=date2.getDate()) return false;
		return true;
	}
	dateIsNewer(date1,date2){
		var diffMillis=date1.getTime()-date2.getTime();
		if (diffMillis>0) return 1; //date1 is higger than date2
		if (diffMillis<0) return -1; //date1 is lower than date2
		return 0;					// date1 is equal than date2
	}
	toMonthStart(date){
		var dtAux=onlyDate(date);
		dtAux.setDate(1);
		if ((typeof bLastDayPreviousMonth!=="undefined")&&(bLastDayPreviousMonth)){
			dtAux=dateAdd(dtAux, 'day',-1);
		}
		return dtAux;
	}
	toMonthEnd(date,bPreviousMonth){
		var dtAux=toMonthStart(date);
		dtAux=dateAdd(dtAux, 'month',1);
		dtAux=dateAdd(dtAux, 'day',-1);
		if ((typeof bPreviousMonth!=="undefined")&&(bPreviousMonth)){
			dtAux=dateAdd(dtAux, 'month',-1);
		}
		return dtAux;
	}
	fullMonthsInter(date1,date2){
		var dtIni=date1;
		var dtEnd=date2;
		if (dtIni.getTime()>dtEnd.getTime()){
			dtIni=date2;
			dtEnd=date1;
		}
		dtIni=toMonthStart(dtIni); 
		dtEnd=toMonthStart(dtEnd);
		var nAux=dtEnd.getFullYear()-dtIni.getFullYear();
		if (nAux==0) {
			return dtEnd.getMonth()-dtIni.getMonth();
		}
		var nMonthsAux=0;
		if (nAux>1){
			nMonthsAux=(nAux-1)*12;
		}
		return nMonthsAux+(dtEnd.getMonth()+12)-dtIni.getMonth();
	}
	dateDiff(date1,date2,units){
		var diffMillis=date1.getTime()-date2.getTime();
		var ret = diffMillis;   
		switch(units.toLowerCase()) {
		    case 'week'   :  ret = (diffMillis/(1000*60*60*24*7));  break;
		    case 'day'    :  ret = (diffMillis/(1000*60*60*24));  break;
		    case 'hour'   :  ret = (diffMillis/(1000*60*60));  break;
		    case 'minute' :  ret = (diffMillis/(1000*60));  break;
		    case 'second' :  ret = (diffMillis/(1000));  break;
		    default       :  ret = diffMillis;   break;
		}
		return ret;
		
	}
	dateAdd(date, interval, units) {
	  var ret = new Date(date); //don't change original date
	  switch(interval.toLowerCase()) {
	    case 'year'   :  ret.setFullYear(ret.getFullYear() + units);  break;
	    case 'quarter':  ret.setMonth(ret.getMonth() + 3*units);  break;
	    case 'month'  :  ret.setMonth(ret.getMonth() + units);  break;
	    case 'week'   :  ret.setDate(ret.getDate() + 7*units);  break;
	    case 'day'    :  ret.setDate(ret.getDate() + units);  break;
	    case 'hour'   :  ret.setTime(ret.getTime() + units*3600000);  break;
	    case 'minute' :  ret.setTime(ret.getTime() + units*60000);  break;
	    case 'second' :  ret.setTime(ret.getTime() + units*1000);  break;
	    default       :  ret = undefined;  break;
	  }
	  return ret;
	}
	
	formatDate(dateObj,format) {
		if (typeof dateObj==="undefined") return "";
		if (dateObj==NaN) return "";
		if (isNaN(dateObj)) return "";
		if (dateObj=="") return "";
		if (typeof dateObj.getDate==="undefined") return "";
	    var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
	    var curr_date = dateObj.getDate();
	    var curr_month = dateObj.getMonth();
	    curr_month = curr_month + 1;
	    var curr_year = dateObj.getFullYear();
	    var curr_min = dateObj.getMinutes();
	    var curr_hr= dateObj.getHours();
	    var curr_sc= dateObj.getSeconds();
	    if(curr_month.toString().length == 1)
	    curr_month = '0' + curr_month;      
	    if(curr_date.toString().length == 1)
	    curr_date = '0' + curr_date;
	    if(curr_hr.toString().length == 1)
	    curr_hr = '0' + curr_hr;
	    if(curr_min.toString().length == 1)
	    curr_min = '0' + curr_min;
	    if(curr_sc.toString().length == 1)
	    curr_sc = '0' + curr_sc;
	
	    if(format ==1)//dd-mm-yyyy
	    {
	        return curr_date + "-"+curr_month+ "-"+curr_year;       
	    }
	    else if(format ==2)//yyyy-mm-dd-hhmmss
	    {
	        return curr_year + "-"+curr_month+ "-"+curr_date+"-"+curr_hr+curr_min+curr_sc;       
	    }
	    else if(format ==3)//dd/mm/yyyy
	    {
	        return curr_date + "/"+curr_month+ "/"+curr_year;       
	    }
	    else if(format ==4)// dd/MM/yyyy HH:mm:ss
	    {
	        return curr_date +"/"+curr_month+"/"+curr_year+ " "+curr_hr+":"+curr_min+":"+curr_sc;       
	    }
	    else if(format ==5)// yyyyMMddHHmmss
	    {
	        return curr_year+""+curr_month+""+curr_date+""+curr_hr+""+curr_min+""+curr_sc;       
	    }
	    else if(format ==6)//yyyy-mm-dd
	    {
	        return curr_year + "-"+curr_month+ "-"+curr_date;
	    }
	}
	
	toDateNormalYYYYMMDD(sDate){ //YYYY-MM-DD
	    var curr_year = parseInt(sDate.substring(0,4));
	    var curr_month = parseInt(sDate.substring(5,7))-1;
	    var curr_date= parseInt(sDate.substring(8,10));
	    var curr_hr= 0;
	    var curr_min = 0;
	    var curr_sc= 0;
		
		var dResult= new Date();
		dResult.setFullYear(curr_year, curr_month, curr_date);
		dResult.setHours(curr_hr);
		dResult.setMinutes(curr_min);
		dResult.setSeconds(curr_sc);
		return dResult;
	}
}
registerClass(RCGDateUtils);
