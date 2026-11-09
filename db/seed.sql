-- =====================================================================
-- Sample data for development and the demo (Calgary-based scenario).
-- All seeded users have the password: password123
--   admin       -> Admin
--   dispatcher  -> Dispatcher
--   client      -> Client
-- =====================================================================
USE reliefnet;

-- People ---------------------------------------------------------------
INSERT INTO Person (Person_ID, First_Name, Last_Name, Phone, Email, DOB, Address) VALUES
 (1,  'Alice',  'Morgan',  '403-555-0101', 'alice@reliefnet.ca',  '1985-03-12', '100 Admin Way SW, Calgary'),
 (2,  'Dan',    'Patel',   '403-555-0102', 'dan@reliefnet.ca',    '1990-07-01', '200 Dispatch Rd NE, Calgary'),
 (3,  'Carla',  'Nguyen',  '403-555-0103', 'carla@example.com',   '1998-11-23', '15 Elbow Dr SW, Calgary'),
 (4,  'Marcus', 'Reid',    '403-555-0104', 'marcus@cfd.ca',       '1982-01-30', '4 Station St, Calgary'),
 (5,  'Priya',  'Singh',   '403-555-0105', 'priya@cfd.ca',        '1988-05-17', '5 Station St, Calgary'),
 (6,  'Owen',   'Clarke',  '403-555-0106', 'owen@ahs-ems.ca',     '1991-09-09', '6 Medic Ave, Calgary'),
 (7,  'Lena',   'Fischer', '403-555-0107', 'lena@ahs-ems.ca',     '1993-02-14', '7 Medic Ave, Calgary'),
 (8,  'Sam',    'Okafor',  '403-555-0108', 'sam@example.com',     '1995-06-20', '8 Helper Cres NW, Calgary'),
 (9,  'Grace',  'Lee',     '403-555-0109', NULL,                  '1950-04-04', '12 Riverfront Ave SE, Calgary'),
 (10, 'Tom',    'Brooks',  '403-555-0110', NULL,                  '1977-12-12', '30 9 Ave SE, Calgary');

-- Resource owners (union of Agency | Volunteer) ------------------------
INSERT INTO Resource_Owner (Owner_ID) VALUES (1), (2), (3);

INSERT INTO Agency (Agency_ID, Name, Type, Contact, Owner_ID) VALUES
 (1, 'Calgary Fire Department', 'Fire', '403-555-1000', 1),
 (2, 'Alberta Health EMS',      'EMS',  '403-555-2000', 2);

INSERT INTO Volunteer (Person_ID, Evac_Status, Availability, Has_Vehicle, Skills, Owner_ID) VALUES
 (8, 'Safe', TRUE, TRUE, 'First aid, heavy lifting', 3);

INSERT INTO Responder (Person_ID, Certification, Rank_Title, Agency_ID) VALUES
 (4, 'Firefighter Level II', 'Captain',    1),
 (5, 'Swift Water Rescue',   'Lieutenant', 1),
 (6, 'Advanced Care Paramedic', 'Supervisor', 2),
 (7, 'Primary Care Paramedic',  'Paramedic',  2);

-- Teams (lat/lng used by the ETA recommendation) -----------------------
INSERT INTO Response_Team (Team_ID, Team_Name, Specialty, Status, Location, Latitude, Longitude, Size, Leader_ID, Agency_ID) VALUES
 (1, 'Engine 7',       'Fire',        'Available', 'Station 7, Downtown',   51.044700, -114.071900, 4, 4, 1),
 (2, 'Rescue Squad 3', 'Water Rescue','Available', 'Station 3, NW',         51.087000, -114.130000, 6, 5, 1),
 (3, 'EMS Unit 12',    'Medical',     'Available', 'South Health Campus',   50.880000, -113.950000, 2, 6, 2);

INSERT INTO Team_Member (Person_ID, Team_ID) VALUES
 (4, 1), (5, 2), (5, 1), (6, 3), (7, 3);

-- Emergencies ----------------------------------------------------------
INSERT INTO Emergency (Emergency_ID, Name, Type, Priority, Status, Location, Latitude, Longitude, Start_Time) VALUES
 (1, 'Bow River Flood',       'Flood',     'High',     'Active', 'East Village / Inglewood', 51.045000, -114.050000, '2026-11-08 06:30:00'),
 (2, 'Nose Hill Grass Fire',  'Wildfire',  'Critical', 'Active', 'Nose Hill Park',           51.110000, -114.110000, '2026-11-09 14:10:00');

INSERT INTO Evacuation_Zone (Emergency_ID, Zone_No, Name, Status, Est_Population) VALUES
 (1, 1, 'East Village',  'Mandatory', 3500),
 (1, 2, 'Inglewood',     'Advisory',  4200),
 (2, 1, 'Edgemont South','Advisory',  2800);

-- Facilities -----------------------------------------------------------
INSERT INTO Facility (Facility_ID, Name, Address, Max_Capacity, Current_Occupancy, Staff_Number, Emergency_ID, Zone_No) VALUES
 (1, 'Genesis Centre Shelter',  '7555 Falconridge Blvd NE', 400, 120, 25, NULL, NULL),
 (2, 'Inglewood Community Hall','1740 24 Ave SE',           80,  60,  6, 1,    2),
 (3, 'Foothills Medical Centre','1403 29 St NW',            900, 610, 300, NULL, NULL);

INSERT INTO Shelter (Facility_ID, Is_Accessible, Has_Food, Pet_Friendly) VALUES
 (1, TRUE, TRUE, TRUE),
 (2, FALSE, TRUE, FALSE);

INSERT INTO Hospital (Facility_ID, ER_Wait_Time, Beds_Available) VALUES
 (3, 95, 42);

-- Victims + medical info ----------------------------------------------
INSERT INTO Victim (Person_ID, Evac_Status, Last_Known_Loc, Emergency_ID, Zone_No, Facility_ID) VALUES
 (9,  'Admitted', 'Riverfront Ave SE', 1, 1, 1),
 (10, 'Missing',  '9 Ave SE',          1, 1, NULL);

INSERT INTO Medical_Info (Person_ID, Info_Number, Medical_Condition, Allergy, Medication, Mobility_Needs, Facility_ID) VALUES
 (9, 1, 'Hypertension', 'Penicillin', 'Amlodipine', 'Uses walker', 1);

INSERT INTO Volunteer_Emergency (Person_ID, Emergency_ID) VALUES (8, 1);

-- Resources ------------------------------------------------------------
INSERT INTO Resource (Resource_ID, Name, Location, Owner_ID) VALUES
 (1, 'Pumper Truck 7',   'Station 7',          1),
 (2, 'Rescue Boat 3',    'Station 3',          1),
 (3, 'Ambulance 12',     'South Health Campus',2),
 (4, 'Sandbag Pallet',   'Station 7',          1),
 (5, 'AED Kit',          'South Health Campus',2),
 (6, 'Sam''s Pickup',    'Helper Cres NW',     3);

INSERT INTO Vehicle (Resource_ID, Plate_Number, Vehicle_Type, Seats, Fuel_Level) VALUES
 (1, 'CFD-0007', 'Fire Engine', 4, 90),
 (2, 'CFD-B003', 'Boat',        6, 75),
 (3, 'AHS-0012', 'Ambulance',   3, 80),
 (6, 'BXR-4821', 'Pickup',      5, 60);

INSERT INTO Equipment (Resource_ID, Equipment_Type, Quantity, Is_Medical) VALUES
 (4, 'Sandbags', 500, FALSE),
 (5, 'Defibrillator', 2, TRUE);

-- System users (password for all: password123) ------------------------
INSERT INTO System_User (User_ID, Username, Password_Hash, Person_ID) VALUES
 (1, 'admin',      '$2a$10$zw.mBBV4NgNUdvrSE.hVde9z0TeE002ABneXKK5quNJiEzgefE30C', 1),
 (2, 'dispatcher', '$2a$10$zw.mBBV4NgNUdvrSE.hVde9z0TeE002ABneXKK5quNJiEzgefE30C', 2),
 (3, 'client',     '$2a$10$zw.mBBV4NgNUdvrSE.hVde9z0TeE002ABneXKK5quNJiEzgefE30C', 3);

INSERT INTO Admin (User_ID, Clearance, Agency_ID) VALUES (1, 3, 1);
INSERT INTO Dispatcher (User_ID, Console_ID, Agency_ID) VALUES (2, 'C-01', 1);
INSERT INTO Client (User_ID, Client_Type) VALUES (3, 'Public');

-- Operations -----------------------------------------------------------
INSERT INTO Status_Update (Emergency_ID, Update_Seq, New_Status, Notes, Time_Stamp, Dispatcher_ID) VALUES
 (1, 1, 'Active',   'River levels exceeded flood stage.',          '2026-11-08 06:35:00', 2),
 (1, 2, 'Active',   'Mandatory evacuation ordered for East Village.', '2026-11-08 08:00:00', 2),
 (2, 1, 'Active',   'Grass fire reported, spreading east.',        '2026-11-09 14:15:00', 2);

INSERT INTO Help_Request (Request_ID, Type, Description, Status, Location, Client_ID, Emergency_ID) VALUES
 (1, 'Evacuation', 'Elderly neighbour cannot leave apartment, water rising.', 'Open', '30 9 Ave SE', 3, 1);

INSERT INTO Dispatch_Assignment (Assignment_ID, Priority, Status, ETA, Is_Sys_Recommended, Team_ID, Dispatcher_ID, Emergency_ID) VALUES
 (1, 'High', 'En Route', 6, TRUE, 2, 2, 1);
UPDATE Response_Team SET Status = 'Deployed' WHERE Team_ID = 2;

INSERT INTO Assignment_Resource (Assignment_ID, Resource_ID) VALUES (1, 2), (1, 4);
