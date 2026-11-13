-- =====================================================================
-- ReliefNet — CPSC 471 Group 38
-- Schema built from 471-Project-RM-Group-38.pdf
--
-- Changes from the RM (discuss with the group, then update the RM/report):
--   1. Team_Member (Responder <-> Response_Team, M:N per EERD) replaces Responder.Team_ID
--   2. Volunteer_Emergency (Volunteer <-> Emergency, M:N per EERD) added
--   3. System_User gets Password_Hash (needed for login)
--   4. Emergency + Response_Team get Latitude/Longitude (needed for ETA recommendation)
--   5. Renamed MySQL reserved words: Responder.Rank -> Rank_Title,
--      Shelter.Accessible -> Is_Accessible,
--      Medical_Info.Condition -> Medical_Condition
--   6. Fixed typo: Is_Sys_Recommened -> Is_Sys_Recommended
--   7. Group decisions: Admin has one Agency_ID; Victim.Facility_ID = current facility only; 
--   Medical_Info.Facility_ID = facility holding the record.
--
-- Tables are created in dependency order (parents before children).
-- =====================================================================

DROP DATABASE IF EXISTS reliefnet;
CREATE DATABASE reliefnet;
USE reliefnet;

-- ---------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------
CREATE TABLE Person (
  Person_ID   INT AUTO_INCREMENT PRIMARY KEY,
  First_Name  VARCHAR(50)  NOT NULL,
  Last_Name   VARCHAR(50)  NOT NULL,
  Phone       VARCHAR(20),
  Email       VARCHAR(100) UNIQUE,
  DOB         DATE,
  Address     VARCHAR(255)
);

-- Union category: a Resource_Owner is exactly one Agency or one Volunteer
CREATE TABLE Resource_Owner (
  Owner_ID INT AUTO_INCREMENT PRIMARY KEY
);

CREATE TABLE Agency (
  Agency_ID INT AUTO_INCREMENT PRIMARY KEY,
  Name      VARCHAR(100) NOT NULL,
  Type      VARCHAR(50),
  Contact   VARCHAR(100),
  Owner_ID  INT NOT NULL UNIQUE,
  FOREIGN KEY (Owner_ID) REFERENCES Resource_Owner(Owner_ID)
);

-- Overlapping specializations of Person: Volunteer, Victim, Responder
CREATE TABLE Volunteer (
  Person_ID    INT PRIMARY KEY,
  Evac_Status  VARCHAR(30),
  Availability BOOLEAN NOT NULL DEFAULT TRUE,
  Has_Vehicle  BOOLEAN NOT NULL DEFAULT FALSE,
  Skills       VARCHAR(255),
  Owner_ID     INT NOT NULL UNIQUE,
  FOREIGN KEY (Person_ID) REFERENCES Person(Person_ID) ON DELETE CASCADE,
  FOREIGN KEY (Owner_ID)  REFERENCES Resource_Owner(Owner_ID)
);

CREATE TABLE Responder (
  Person_ID     INT PRIMARY KEY,
  Certification VARCHAR(100),
  Rank_Title    VARCHAR(50),
  Agency_ID     INT,
  FOREIGN KEY (Person_ID) REFERENCES Person(Person_ID) ON DELETE CASCADE,
  FOREIGN KEY (Agency_ID) REFERENCES Agency(Agency_ID) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------
-- Response teams
-- ---------------------------------------------------------------------
CREATE TABLE Response_Team (
  Team_ID   INT AUTO_INCREMENT PRIMARY KEY,
  Team_Name VARCHAR(100) NOT NULL,
  Specialty VARCHAR(50),
  Status    ENUM('Available','Deployed','Off Duty') NOT NULL DEFAULT 'Available',
  Location  VARCHAR(255),
  Latitude  DECIMAL(9,6),
  Longitude DECIMAL(9,6),
  Size      INT CHECK (Size >= 0),
  Leader_ID INT UNIQUE,                 -- 1:1 lead responder
  Agency_ID INT NOT NULL,
  FOREIGN KEY (Leader_ID) REFERENCES Responder(Person_ID) ON DELETE SET NULL,
  FOREIGN KEY (Agency_ID) REFERENCES Agency(Agency_ID)
);

CREATE TABLE Team_Member (
  Person_ID INT,
  Team_ID   INT,
  PRIMARY KEY (Person_ID, Team_ID),
  FOREIGN KEY (Person_ID) REFERENCES Responder(Person_ID) ON DELETE CASCADE,
  FOREIGN KEY (Team_ID)   REFERENCES Response_Team(Team_ID) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Emergencies, zones, facilities
-- ---------------------------------------------------------------------
CREATE TABLE Emergency (
  Emergency_ID INT AUTO_INCREMENT PRIMARY KEY,
  Name         VARCHAR(100) NOT NULL,
  Type         VARCHAR(50)  NOT NULL,
  Priority     ENUM('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
  Status       ENUM('Active','Contained','Resolved') NOT NULL DEFAULT 'Active',
  Location     VARCHAR(255),
  Latitude     DECIMAL(9,6),
  Longitude    DECIMAL(9,6),
  Start_Time   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  End_Time     DATETIME,
  CHECK (End_Time IS NULL OR End_Time >= Start_Time)
);

-- Weak entity: owner Emergency, partial key Zone_No
CREATE TABLE Evacuation_Zone (
  Emergency_ID   INT,
  Zone_No        INT,
  Name           VARCHAR(100),
  Status         ENUM('Advisory','Mandatory','Cleared') NOT NULL DEFAULT 'Advisory',
  Est_Population INT CHECK (Est_Population >= 0),
  PRIMARY KEY (Emergency_ID, Zone_No),
  FOREIGN KEY (Emergency_ID) REFERENCES Emergency(Emergency_ID) ON DELETE CASCADE
);

CREATE TABLE Facility (
  Facility_ID       INT AUTO_INCREMENT PRIMARY KEY,
  Name              VARCHAR(100) NOT NULL,
  Address           VARCHAR(255),
  Max_Capacity      INT NOT NULL,
  Current_Occupancy INT NOT NULL DEFAULT 0,
  Staff_Number      INT,
  Emergency_ID      INT,
  Zone_No           INT,
  CHECK (Max_Capacity >= 0),
  CHECK (Current_Occupancy >= 0 AND Current_Occupancy <= Max_Capacity),
  FOREIGN KEY (Emergency_ID, Zone_No)
    REFERENCES Evacuation_Zone(Emergency_ID, Zone_No) ON DELETE SET NULL
);

-- Disjoint specialization of Facility (enforced by triggers.sql)
CREATE TABLE Shelter (
  Facility_ID  INT PRIMARY KEY,
  Is_Accessible   BOOLEAN NOT NULL DEFAULT FALSE,
  Has_Food     BOOLEAN NOT NULL DEFAULT FALSE,
  Pet_Friendly BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (Facility_ID) REFERENCES Facility(Facility_ID) ON DELETE CASCADE
);

CREATE TABLE Hospital (
  Facility_ID    INT PRIMARY KEY,
  ER_Wait_Time   INT,               -- minutes
  Beds_Available INT CHECK (Beds_Available >= 0),
  FOREIGN KEY (Facility_ID) REFERENCES Facility(Facility_ID) ON DELETE CASCADE
);

CREATE TABLE Victim (
  Person_ID      INT PRIMARY KEY,
  Evac_Status    ENUM('Missing','Located','Evacuated','Admitted') NOT NULL DEFAULT 'Missing',
  Last_Known_Loc VARCHAR(255),
  Emergency_ID   INT,
  Zone_No        INT,
  Facility_ID    INT,               -- current facility (admitted to)
  FOREIGN KEY (Person_ID) REFERENCES Person(Person_ID) ON DELETE CASCADE,
  FOREIGN KEY (Emergency_ID, Zone_No)
    REFERENCES Evacuation_Zone(Emergency_ID, Zone_No) ON DELETE SET NULL,
  FOREIGN KEY (Facility_ID) REFERENCES Facility(Facility_ID) ON DELETE SET NULL
);

-- Weak entity: owner Person, partial key Info_Number
CREATE TABLE Medical_Info (
  Person_ID         INT,
  Info_Number       INT,
  Medical_Condition VARCHAR(255),
  Allergy           VARCHAR(255),
  Medication        VARCHAR(255),
  Mobility_Needs    VARCHAR(255),
  Facility_ID       INT,
  PRIMARY KEY (Person_ID, Info_Number),
  FOREIGN KEY (Person_ID)   REFERENCES Person(Person_ID) ON DELETE CASCADE,
  FOREIGN KEY (Facility_ID) REFERENCES Facility(Facility_ID) ON DELETE SET NULL
);

CREATE TABLE Volunteer_Emergency (
  Person_ID    INT,
  Emergency_ID INT,
  PRIMARY KEY (Person_ID, Emergency_ID),
  FOREIGN KEY (Person_ID)    REFERENCES Volunteer(Person_ID) ON DELETE CASCADE,
  FOREIGN KEY (Emergency_ID) REFERENCES Emergency(Emergency_ID) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Resources (disjoint: Vehicle | Equipment)
-- ---------------------------------------------------------------------
CREATE TABLE Resource (
  Resource_ID INT AUTO_INCREMENT PRIMARY KEY,
  Name        VARCHAR(100) NOT NULL,
  Location    VARCHAR(255),
  Owner_ID    INT NOT NULL,
  FOREIGN KEY (Owner_ID) REFERENCES Resource_Owner(Owner_ID)
);

CREATE TABLE Vehicle (
  Resource_ID  INT PRIMARY KEY,
  Plate_Number VARCHAR(20) UNIQUE,
  Vehicle_Type VARCHAR(50),
  Seats        INT CHECK (Seats >= 0),
  Fuel_Level   INT CHECK (Fuel_Level BETWEEN 0 AND 100),   -- percent
  FOREIGN KEY (Resource_ID) REFERENCES Resource(Resource_ID) ON DELETE CASCADE
);

CREATE TABLE Equipment (
  Resource_ID    INT PRIMARY KEY,
  Equipment_Type VARCHAR(50),
  Quantity       INT NOT NULL DEFAULT 1 CHECK (Quantity >= 0),
  Is_Medical     BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (Resource_ID) REFERENCES Resource(Resource_ID) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- System users (disjoint: Admin | Dispatcher | Client)
-- ---------------------------------------------------------------------
CREATE TABLE System_User (
  User_ID       INT AUTO_INCREMENT PRIMARY KEY,
  Username      VARCHAR(50)  NOT NULL UNIQUE,
  Password_Hash VARCHAR(100) NOT NULL,
  Creation_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Person_ID     INT NOT NULL UNIQUE,
  FOREIGN KEY (Person_ID) REFERENCES Person(Person_ID) ON DELETE CASCADE
);

CREATE TABLE Admin (
  User_ID   INT PRIMARY KEY,
  Clearance INT NOT NULL DEFAULT 1,
  Agency_ID INT,
  FOREIGN KEY (User_ID)   REFERENCES System_User(User_ID) ON DELETE CASCADE,
  FOREIGN KEY (Agency_ID) REFERENCES Agency(Agency_ID) ON DELETE SET NULL
);

CREATE TABLE Dispatcher (
  User_ID    INT PRIMARY KEY,
  Console_ID VARCHAR(20),
  Agency_ID  INT NOT NULL,
  FOREIGN KEY (User_ID)   REFERENCES System_User(User_ID) ON DELETE CASCADE,
  FOREIGN KEY (Agency_ID) REFERENCES Agency(Agency_ID)
);

CREATE TABLE Client (
  User_ID     INT PRIMARY KEY,
  Client_Type VARCHAR(30) NOT NULL DEFAULT 'Public',
  FOREIGN KEY (User_ID) REFERENCES System_User(User_ID) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Operations
-- ---------------------------------------------------------------------
-- Weak entity: owner Emergency, partial key Update_Seq
CREATE TABLE Status_Update (
  Emergency_ID  INT,
  Update_Seq    INT,
  New_Status    VARCHAR(50) NOT NULL,
  Notes         TEXT,
  Time_Stamp    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Dispatcher_ID INT,
  PRIMARY KEY (Emergency_ID, Update_Seq),
  FOREIGN KEY (Emergency_ID)  REFERENCES Emergency(Emergency_ID) ON DELETE CASCADE,
  FOREIGN KEY (Dispatcher_ID) REFERENCES Dispatcher(User_ID) ON DELETE SET NULL
);

CREATE TABLE Help_Request (
  Request_ID     INT AUTO_INCREMENT PRIMARY KEY,
  Type           VARCHAR(50) NOT NULL,
  Description    TEXT,
  Status         ENUM('Open','In Progress','Resolved','Cancelled') NOT NULL DEFAULT 'Open',
  Location       VARCHAR(255),
  Submitted_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Client_ID      INT NOT NULL,
  Emergency_ID   INT NOT NULL,
  FOREIGN KEY (Client_ID)    REFERENCES Client(User_ID) ON DELETE CASCADE,
  FOREIGN KEY (Emergency_ID) REFERENCES Emergency(Emergency_ID) ON DELETE CASCADE
);

CREATE TABLE Dispatch_Assignment (
  Assignment_ID      INT AUTO_INCREMENT PRIMARY KEY,
  Priority           ENUM('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
  Status             ENUM('Assigned','En Route','On Scene','Completed','Cancelled') NOT NULL DEFAULT 'Assigned',
  Assigned_Date      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ETA                INT,               -- minutes
  Is_Sys_Recommended BOOLEAN NOT NULL DEFAULT FALSE,
  Team_ID            INT NOT NULL,
  Dispatcher_ID      INT NOT NULL,
  Emergency_ID       INT NOT NULL,
  FOREIGN KEY (Team_ID)       REFERENCES Response_Team(Team_ID),
  FOREIGN KEY (Dispatcher_ID) REFERENCES Dispatcher(User_ID),
  FOREIGN KEY (Emergency_ID)  REFERENCES Emergency(Emergency_ID) ON DELETE CASCADE
);

CREATE TABLE Assignment_Resource (
  Assignment_ID INT,
  Resource_ID   INT,
  PRIMARY KEY (Assignment_ID, Resource_ID),
  FOREIGN KEY (Assignment_ID) REFERENCES Dispatch_Assignment(Assignment_ID) ON DELETE CASCADE,
  FOREIGN KEY (Resource_ID)   REFERENCES Resource(Resource_ID) ON DELETE CASCADE
);
