import { useMemo } from 'react';

export function useStaffAvailability(staffList = [], selectedDateStr) {
  const staffStatusMap = useMemo(() => {
    const map = {};
    if (!selectedDateStr) return map;

    const dateObj = new Date(selectedDateStr);
    const dayOfWeek = dateObj.getDay();

    staffList.forEach((member, index) => {
      const id = member._id || member.id;
      if (!id) return;

      // --- ТЕСТОВАЯ ПРОВЕРКА (каждый второй барбер будет OFF) ---
      // В реальном проекте здесь проверки: member.isOff || member.workDays...
      const isTestOff = index % 2 === 1; 

      if (member.isOff || member.status === 'off' || isTestOff) {
        map[id] = { isOff: true, reason: 'Day Off' };
        return;
      }

      map[id] = { isOff: false, reason: 'Working' };
    });

    return map;
  }, [staffList, selectedDateStr]);

  const isStaffOff = (staffId) => Boolean(staffStatusMap[staffId]?.isOff);
  const getStaffStatus = (staffId) => staffStatusMap[staffId] || { isOff: false, reason: 'Working' };

  return { staffStatusMap, isStaffOff, getStaffStatus };
}