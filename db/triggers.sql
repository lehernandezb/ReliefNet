-- =====================================================================
-- Triggers that enforce EERD constraints MySQL can't express with
-- CHECK / FK alone. Run after schema.sql.
--
-- Note: no DELIMITER lines — this file is run by server/scripts/resetDb.js,
-- which sends each statement to MySQL directly. (DELIMITER is only a
-- mysql command-line client thing.) Statements are separated by a line
-- containing only the separator marker (two dashes, a space, two semicolons).
-- =====================================================================

-- Disjoint: a Resource is a Vehicle OR Equipment, never both
CREATE TRIGGER vehicle_disjoint BEFORE INSERT ON Vehicle
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM Equipment WHERE Resource_ID = NEW.Resource_ID) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Resource is already Equipment (disjoint)';
  END IF;
END
-- ;;
CREATE TRIGGER equipment_disjoint BEFORE INSERT ON Equipment
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM Vehicle WHERE Resource_ID = NEW.Resource_ID) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Resource is already a Vehicle (disjoint)';
  END IF;
END
-- ;;
-- Disjoint: a Facility is a Shelter OR Hospital, never both
CREATE TRIGGER shelter_disjoint BEFORE INSERT ON Shelter
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM Hospital WHERE Facility_ID = NEW.Facility_ID) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Facility is already a Hospital (disjoint)';
  END IF;
END
-- ;;
CREATE TRIGGER hospital_disjoint BEFORE INSERT ON Hospital
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM Shelter WHERE Facility_ID = NEW.Facility_ID) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Facility is already a Shelter (disjoint)';
  END IF;
END
-- ;;
-- Disjoint: a System_User is exactly one of Admin / Dispatcher / Client
CREATE TRIGGER admin_disjoint BEFORE INSERT ON Admin
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM Dispatcher WHERE User_ID = NEW.User_ID)
     OR EXISTS (SELECT 1 FROM Client WHERE User_ID = NEW.User_ID) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User already has a role (disjoint)';
  END IF;
END
-- ;;
CREATE TRIGGER dispatcher_disjoint BEFORE INSERT ON Dispatcher
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM Admin WHERE User_ID = NEW.User_ID)
     OR EXISTS (SELECT 1 FROM Client WHERE User_ID = NEW.User_ID) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User already has a role (disjoint)';
  END IF;
END
-- ;;
CREATE TRIGGER client_disjoint BEFORE INSERT ON Client
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM Admin WHERE User_ID = NEW.User_ID)
     OR EXISTS (SELECT 1 FROM Dispatcher WHERE User_ID = NEW.User_ID) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User already has a role (disjoint)';
  END IF;
END
-- ;;
-- Union category: a Resource_Owner belongs to an Agency OR a Volunteer, not both
CREATE TRIGGER agency_owner_union BEFORE INSERT ON Agency
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM Volunteer WHERE Owner_ID = NEW.Owner_ID) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Owner_ID already belongs to a Volunteer';
  END IF;
END
-- ;;
CREATE TRIGGER volunteer_owner_union BEFORE INSERT ON Volunteer
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM Agency WHERE Owner_ID = NEW.Owner_ID) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Owner_ID already belongs to an Agency';
  END IF;
END
