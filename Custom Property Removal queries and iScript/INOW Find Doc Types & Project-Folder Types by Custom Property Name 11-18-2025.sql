/*********************************
	Queries to find Document Type and Project/Folder Types by Custom Property name if the Custom Property is attached.
	Also shows if the Custom Property requires a values when creating a record.

	Query 1: Search by Custom Prop name and return document types attached.
	Query 2: Search by Custom Prop name and return project types attached.
**********************************/
SELECT IDT.DOC_TYPE_NAME, IP.PROP_NAME, IP.PROP_TYPE,
	CASE (ICP.IS_REQUIRED)
		WHEN 0
			THEN 'NO'
		WHEN 1
			THEN 'YES'
		END AS REQUIRED_FIELD
FROM INUSER.IN_CLASS_PROP ICP
LEFT JOIN INUSER.IN_PROP IP	ON ICP.PROP_ID = IP.PROP_ID
LEFT JOIN INUSER.IN_DOC_TYPE IDT ON ICP.CLASS_ID = IDT.CLASS_ID
WHERE IDT.DOC_TYPE_NAME IS NOT NULL
	AND IP.PROP_NAME like '%' -- Enter search pattern here with % as the wildcard char
ORDER BY IDT.DOC_TYPE_NAME ASC;



SELECT ipt.PROJ_TYPE_NAME, IP.PROP_NAME, IP.PROP_TYPE,
	CASE (ICP.IS_REQUIRED)
		WHEN 0
			THEN 'NO'
		WHEN 1
			THEN 'YES'
		END AS REQUIRED_FIELD
FROM INUSER.IN_CLASS_PROP ICP
LEFT JOIN INUSER.IN_PROP IP	ON ICP.PROP_ID = IP.PROP_ID
LEFT JOIN INUSER.IN_PROJ_TYPE IPT ON ICP.CLASS_ID = IPT.CLASS_ID
WHERE IPT.PROJ_TYPE_NAME IS NOT NULL
	AND IP.PROP_NAME like '%' -- Enter search pattern here with % as the wildcard char
ORDER BY IPT.PROJ_TYPE_NAME ASC;
