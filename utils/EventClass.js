const moment = require('moment');

class Event {
  /**
   * Retrieve a list of free slots over the next 7 days starting from now
   * @param {array} events 
   */
    getFreeSlots(events) {
        const startDate = moment()
        const endDate = moment().add(7, "days")
        const hours = [8,9,10,11,12,14,15,16,17,18]
        const eventDuration = 60

        // Create an array of days starting from 9 am to 7 pm
        // Each day should be composed by an amount of slots of 1 hour each one
        // Each day should have a fixed busy slot from 1 pm and 2 pm
        const currentDay = startDate;
        const days = {}

        while (currentDay.isBefore(endDate)) {
            days[currentDay.format("YYYY-MM-DD")] = hours.reduce((previousValue, hour) => {
                const start = moment(currentDay).hour(hour).minute(0).seconds(0).milliseconds(0)
                const end = moment(currentDay).hour(hour).minute(0).seconds(0).milliseconds(0).add(eventDuration, "minutes")
                if (start.isBefore(moment())) return previousValue
                if (!events.some(event => moment(event.start).isBetween(start, end,undefined, '[]') || moment(event.end).isBetween(start, end,undefined, '[]'))) previousValue.push({start, end})
                return previousValue
            }, [])
            currentDay.add(1, "day")
        }

        return this.formatFreeSlots(days)
    }


    formatFreeSlots(daySlots) {
        Object.keys(daySlots).map((daySlot) => {
            console.log(`Slots available on ${moment(daySlot).format("DD-MM-YYYY")}`)
            daySlots[daySlot].map(slot => {
                console.log(`from ${moment(slot.start).format("HH:mm")} to ${moment(slot.end).format("HH:mm")}`)
            })
            
        })
    }
}

module.exports = Event
