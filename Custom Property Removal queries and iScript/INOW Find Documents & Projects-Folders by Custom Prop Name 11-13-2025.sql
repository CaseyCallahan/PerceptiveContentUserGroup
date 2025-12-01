/************************************
  Searches for Documents & Projects/Folders by Custom Propery Name
  Retuns identifiers and any CP values that are set except for Composite Custom Property
  
  Replace CUSTOMPROPNAME in DECLARE statement with the Custom Propery Name you want to search by.
  Remove the -- in front of the WHERE clause to omit records that do not have a Custom Property value set.
  
  If column IS_NULL = 1 (true) then no value is set for the CP on that document record.
  If column TIME_VAL = '1970-01-01 00:00:00.000' then no value is set in that record.
  If column NUMBER_VAL = 0 and IS_NULL = 1 then no value is set in that record.
*************************************/

DECLARE @CPname varchar(40) = 'CUSTOMPROPNAME'

SELECT ipr.PROJ_ID, ipr.PROJ_NAME, ipt.PROJ_TYPE_NAME,@CPname as [CP Name],ip_2.INSTANCE_ID,IP_2.IS_NULL, IP_2.NUMBER_VAL,IP_2.STRING_VAL,IP_2.TIME_VAL,IPV_2.VAL_NAME
FROM inuser.IN_PROJ as ipr
	INNER JOIN inuser.IN_PROJ_TYPE ipt on ipt.PROJ_TYPE_ID = ipr.PROJ_TYPE_ID
	INNER JOIN inuser.in_instance i on i.INSTANCE_ID = ipr.INSTANCE_ID
	INNER JOIN inuser.IN_INSTANCE_PROP IP_2 ON ipr.INSTANCE_ID = IP_2.INSTANCE_ID AND IP_2.PROP_ID = (select prop_ID from inuser.in_prop where prop_name = @CPName and IS_ACTIVE =1)
	LEFT OUTER JOIN inuser.in_prop_val IPV_2 on IP_2.STRING_VAL = IPV_2.PROP_VAL_ID
--WHERE IP_2.IS_NULL = 0 /*Uncomment the beginning of this line to only return documents that have CP values set*/

SELECT doc.DOC_ID, idt.DOC_TYPE_NAME, @CPname as [CP Name],ip_2.INSTANCE_ID,IP_2.IS_NULL, IP_2.NUMBER_VAL,IP_2.STRING_VAL,IP_2.TIME_VAL,IPV_2.VAL_NAME
FROM inuser.in_doc doc 
	INNER JOIN inuser.IN_INSTANCE i ON i.INSTANCE_ID = doc.INSTANCE_ID AND i.CLASS_TYPE = 1
	INNER JOIN inuser.IN_DOC_TYPE idt on doc.DOC_TYPE_ID = idt.DOC_TYPE_ID
	INNER JOIN inuser.IN_INSTANCE_PROP IP_2 ON doc.INSTANCE_ID = IP_2.INSTANCE_ID AND IP_2.PROP_ID = (select prop_ID from inuser.in_prop where prop_name = @CPName and IS_ACTIVE =1) 
	LEFT OUTER JOIN inuser.in_prop_val IPV_2 on IP_2.STRING_VAL = IPV_2.PROP_VAL_ID
--WHERE IP_2.IS_NULL = 0 /*Uncomment the beginning of this line to only return documents that have CP values set*/
