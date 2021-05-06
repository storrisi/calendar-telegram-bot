const moment = require('moment');

class Event {
  static EMPTY_VALUE = "EMPTY_VALUE"
  static EMPTY_DAY = "EMPTY_DAY"
  static EMPTY_STARTING_HOUR = "EMPTY_STARTING_HOUR"
  static EMPTY_ENDING_HOUR = "EMPTY_ENDING_HOUR"
  static START_GREATER_THAN_END = "START_GREATER_THAN_END"
  static END_LOWER_THAN_START = "END_LOWER_THAN_START"

  static validate({ eventName, slots }) {
    const errors = {}
    if (eventName === "") errors.eventName = false
    slots.forEach((slot, index) => {
      const res = this.validateSlot(slot)
      if (res !== true) errors.slots = { ...errors.slots, [index]: res }
    })

    return errors
  }

  static validateSlot(event) {
    if (event.day === "" && event.startingHour === "" && event.endingHour === "") return this.EMPTY_VALUE
    if (event.day === "") return this.EMPTY_DAY
    if (event.startingHour === "") return this.EMPTY_STARTING_HOUR
    if (event.endingHour === "") return this.EMPTY_ENDING_HOUR
    if (event.startingHour >= event.endingHour) return this.START_GREATER_THAN_END
    if (event.endingHour <= event.startingHour) return this.END_LOWER_THAN_START
    return true
  }

  static getAvailableDays(event) {
    const { availabilities } = event
    return availabilities.reduce((previousValue, currentValue) => {
      if (currentValue.day === "workingDays")
        previousValue = [...new Set([...previousValue, ...["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]])]
      return previousValue
    }, [])
  }

  static getSlots(event) {
    return event.availabilities.reduce((previousValue, currentValue) => {
      let days = []
      if (currentValue.day === "workingDays") {
        days = [1, 2, 3, 4, 5]
      } else {
        const currentDay = moment().day(currentValue.day)
        days = [currentDay.day()]
      }

      let dateStart = moment()
        .hour(currentValue.startingHour.split(":")[0])
        .minute(currentValue.startingHour.split(":")[1])
        .second(0)
      const endDate = moment()
        .hour(currentValue.endingHour.split(":")[0])
        .minute(currentValue.endingHour.split(":")[1])
        .second(0)

      const hours = []

      while (dateStart.isBefore(endDate)) {
        hours.push(dateStart)
        dateStart = moment(dateStart).add(event.duration, "minutes")
      }

      days.forEach((day) => {
        if (!Object(previousValue).hasOwnProperty(day)) previousValue[day] = []
        previousValue[day] = previousValue[day].concat(hours)
      })

      console.log(previousValue)
      return previousValue
    }, {})
  }

  /**
   * Check if the current date is blocked because of the configuration of the event
   * If allowMaxEventsPerDay or allowMaxEventsPerWeek is enabled, check the amount of booking already set for the same period of time
   * @param {*} event
   * @param {*} bookings
   * @param {*} date
   */
  static isBlockedDay(event, bookings, date) {
    const { allowMaxEventsPerDay, allowMaxEventsPerWeek, maxEventsPerDay, maxEventsPerWeek } = event
    if (!allowMaxEventsPerDay && !allowMaxEventsPerWeek) return false
    if (!bookings) return false

    if (allowMaxEventsPerDay) {
      const bookingsPerDay = bookings.filter((booking) => moment(booking.date).isSame(date, "day"))
      if (bookingsPerDay.length >= maxEventsPerDay) return true
    }
    if (allowMaxEventsPerWeek) {
      const bookingsPerWeek = bookings.filter((booking) => moment(booking.date).isSame(date, "week"))
      if (bookingsPerWeek.length >= maxEventsPerWeek) return true
    }

    return false
  }

  /**
   * Check whether is a busy slot comparing the date with any event date
   * @param {*} slot
   * @param {*} date
   * @param {*} duration
   * @param {*} sameDay
   */
  static isBusySlot(slot, date, duration, sameDay) {
    const slotStart = moment(date.hour(slot.hour()))
    const slotEnd = moment(date.hour(slot.hour()))
    slotEnd.add(duration, "m")
    const eventStart = moment(sameDay.start)
    const eventEnd = moment(sameDay.end)
    return (
      slotStart.isBetween(eventStart, eventEnd, undefined, "[)") ||
      slotEnd.isBetween(eventStart, eventEnd, undefined, "(]")
    )
  }

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
