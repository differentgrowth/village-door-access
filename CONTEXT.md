# Village door access

Village door access. A Visitor records a Visit at a Location and then sees that Location's current Access Code. An Operator with the Password opens Admin, where they add Locations, rotate Access Codes, and read Visits. A Location is any physical door — not only the gym hall.

Agents and code speak English. Spanish appears only in UI strings.

## Places

**Location**:
A physical door. It owns one current Access Code, its Access Code History, and its Visits. Names are unique.
_Avoid_: site, building, venue, gym (when meaning one door), door (when meaning the Location), access point

**Archive**:
Hiding a Location from the door tablet without destroying its Visits or Access Code History. Restore puts it back on the tablet. A Location can be renamed. It cannot be hard-deleted. The last remaining Location cannot be archived.
_Avoid_: delete, remove

## Access

**Access Code**:
The shared four-digit code that opens one Location. Each Location has its own. Shown only after a Visit is recorded at that Location.
_Avoid_: PIN, password, OTP, door code

**Access Code History**:
The sequence of Access Codes issued at a Location. Exactly one is current.
_Avoid_: password history

**Rotation**:
Replacing the current Access Code at a Location so the previous code no longer opens that door.
_Avoid_: reset, regenerate, refresh

**Password**:
The single shared secret that opens Admin for every Location. At least eight characters. Letters, digits, and symbols are allowed. No complexity rules. Not an Access Code.
_Avoid_: PIN, Access Code, OTP, admin password

## People and records

**Visitor**:
The person at the door. Known only by the name they type. Not stored as their own record.
_Avoid_: user, member, socio, customer, account holder

**Visit**:
A recorded appearance at a Location, identified by the Visitor's name and the Access Code in force there at that moment. A repeated name within 90 seconds counts as the same Visit only at that Location. The row is erased after 90 days.
_Avoid_: check-in, checkin, entry, attendance, registro

**Visit count**:
How many Visits have ever been recorded at a Location. It does not go down when old Visits are erased.
_Avoid_: total, tally (when you mean this number, say Visit count)

**Notice**:
The optional email sent when a Visit is recorded. It names the Location.
_Avoid_: alert, notification blast

**Operator**:
Whoever holds the Password. There is no Operator record.
_Avoid_: admin user, manager, ayuntamiento (the town hall is not an actor in the software)

**Admin**:
The Operator surface for creating, archiving, and restoring Locations, rotating Access Codes, and reading Visits. Reached after the Password gate. UI label: Gestión.
_Avoid_: dashboard, backoffice, control panel
