# Visit rows are erased after 90 days

A Visit holds a person’s name. RGPD storage limitation says we keep that only as long as the door book needs it. After 90 days the Visit row is deleted. Locations and Access Code History stay.

Each Location keeps a **Visit count**: how many Visits were ever recorded there. The purge does not decrement it, so Admin still shows a lifetime total after names are gone. Today’s count is counted from remaining rows (today is never 90 days old).
