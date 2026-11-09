-- =====================================================================
-- Showcase queries for the report / demo.
-- The app runs these (parameterized) from server/src/queries/*.js —
-- keep this file in sync so the grader can read every query in one place.
-- "?" marks a parameter.
-- =====================================================================
USE reliefnet;

-- Q1. Recommend the closest available teams for an emergency (ETA, minutes)
--     Distance via ST_Distance_Sphere (metres); assumes 50 km/h average speed.
SELECT  t.Team_ID, t.Team_Name, t.Specialty, a.Name AS Agency,
        ROUND(ST_Distance_Sphere(POINT(t.Longitude, t.Latitude),
                                 POINT(e.Longitude, e.Latitude)) / 1000, 2) AS Distance_Km,
        CEIL(ST_Distance_Sphere(POINT(t.Longitude, t.Latitude),
                                POINT(e.Longitude, e.Latitude)) / 1000 / 50 * 60) AS ETA_Min
FROM    Response_Team t
JOIN    Agency a     ON a.Agency_ID = t.Agency_ID
JOIN    Emergency e  ON e.Emergency_ID = ?
WHERE   t.Status = 'Available'
ORDER BY Distance_Km
LIMIT 3;

-- Q2. Active emergencies with counts of open help requests and assignments
SELECT  e.Emergency_ID, e.Name, e.Type, e.Priority, e.Status,
        (SELECT COUNT(*) FROM Help_Request h
          WHERE h.Emergency_ID = e.Emergency_ID AND h.Status = 'Open') AS Open_Requests,
        (SELECT COUNT(*) FROM Dispatch_Assignment d
          WHERE d.Emergency_ID = e.Emergency_ID) AS Assignments
FROM    Emergency e
WHERE   e.Status <> 'Resolved'
ORDER BY FIELD(e.Priority, 'Critical', 'High', 'Medium', 'Low'), e.Start_Time;

-- Q3. Shelters with space left, most room first
SELECT  f.Facility_ID, f.Name, f.Address,
        f.Max_Capacity - f.Current_Occupancy AS Spaces_Left,
        s.Is_Accessible, s.Has_Food, s.Pet_Friendly
FROM    Facility f
JOIN    Shelter s ON s.Facility_ID = f.Facility_ID
WHERE   f.Current_Occupancy < f.Max_Capacity
ORDER BY Spaces_Left DESC;

-- Q4. Status-update timeline for an emergency (with dispatcher name)
SELECT  su.Update_Seq, su.New_Status, su.Notes, su.Time_Stamp,
        CONCAT(p.First_Name, ' ', p.Last_Name) AS Posted_By
FROM    Status_Update su
LEFT JOIN Dispatcher d  ON d.User_ID = su.Dispatcher_ID
LEFT JOIN System_User u ON u.User_ID = d.User_ID
LEFT JOIN Person p      ON p.Person_ID = u.Person_ID
WHERE   su.Emergency_ID = ?
ORDER BY su.Update_Seq;

-- Q5. Resources not currently tied to an active assignment, with their type
SELECT  r.Resource_ID, r.Name, r.Location,
        CASE WHEN v.Resource_ID IS NOT NULL THEN 'Vehicle' ELSE 'Equipment' END AS Kind,
        COALESCE(ag.Name, CONCAT(p.First_Name, ' ', p.Last_Name)) AS Owner
FROM    Resource r
LEFT JOIN Vehicle v    ON v.Resource_ID = r.Resource_ID
LEFT JOIN Agency ag    ON ag.Owner_ID = r.Owner_ID
LEFT JOIN Volunteer vo ON vo.Owner_ID = r.Owner_ID
LEFT JOIN Person p     ON p.Person_ID = vo.Person_ID
WHERE   r.Resource_ID NOT IN (
          SELECT ar.Resource_ID
          FROM   Assignment_Resource ar
          JOIN   Dispatch_Assignment da ON da.Assignment_ID = ar.Assignment_ID
          WHERE  da.Status NOT IN ('Completed', 'Cancelled'));

-- Q6. Next sequence number for a new status update (run inside a transaction)
SELECT COALESCE(MAX(Update_Seq), 0) + 1 AS Next_Seq
FROM   Status_Update
WHERE  Emergency_ID = ?
FOR UPDATE;
