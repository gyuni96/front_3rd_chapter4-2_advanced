import { Box, Flex, Grid, GridItem, Text } from "@chakra-ui/react"
import { CellSize, DAY_LABELS, 분 } from "./constants.ts"
import { Schedule } from "./types.ts"
import { fill2, parseHnM } from "./utils.ts"
import { Fragment, memo, useCallback } from "react"
import DraggableSchedule from "./DraggableSchedule.tsx"
import { useDndActive } from "./ScheduleDndProvider.tsx"
import { useScheduleContext } from "./ScheduleContext.tsx"

interface Props {
  tableId: string
  schedules: Schedule[]
  setSearchInfo: React.Dispatch<
    React.SetStateAction<{
      tableId: string
      day?: string
      time?: number
    } | null>
  >
}

const TIMES = [
  ...Array(18)
    .fill(0)
    .map((v, k) => v + k * 30 * 분)
    .map((v) => `${parseHnM(v)}~${parseHnM(v + 30 * 분)}`),

  ...Array(6)
    .fill(18 * 30 * 분)
    .map((v, k) => v + k * 55 * 분)
    .map((v) => `${parseHnM(v)}~${parseHnM(v + 50 * 분)}`),
] as const

const ScheduleTable = memo(({ tableId, schedules, setSearchInfo }: Props) => {
  const { setSchedulesMap } = useScheduleContext()
  const activeId = useDndActive()

  const getColor = useCallback(
    (lectureId: string): string => {
      const lectures = [...new Set(schedules.map(({ lecture }) => lecture.id))]
      const colors = ["#fdd", "#ffd", "#dff", "#ddf", "#fdf", "#dfd"]
      return colors[lectures.indexOf(lectureId) % colors.length]
    },
    [schedules]
  )

  const getActiveTableId = useCallback(() => {
    if (activeId) {
      return String(activeId).split(":")[0]
    }
    return null
  }, [activeId])

  const activeTableId = getActiveTableId()

  // 핸들러 함수 메모이제이션
  const handleTimeClick = useCallback(
    (timeInfo: { day: string; time: number }) => {
      setSearchInfo({ tableId, ...timeInfo })
    },
    [setSearchInfo, tableId]
  )

  const handleDeleteButtonClick = useCallback(
    ({ day, time }: { day: string; time: number }) => {
      setSchedulesMap((prev) => ({
        ...prev,
        [tableId]: prev[tableId].filter(
          (schedule) => schedule.day !== day || !schedule.range.includes(time)
        ),
      }))
    },
    [setSchedulesMap, tableId]
  )

  return (
    <Box
      position="relative"
      outline={activeTableId === tableId ? "5px dashed" : undefined}
      outlineColor="blue.300"
    >
      <Grid
        templateColumns={`120px repeat(${DAY_LABELS.length}, ${CellSize.WIDTH}px)`}
        templateRows={`40px repeat(${TIMES.length}, ${CellSize.HEIGHT}px)`}
        bg="white"
        fontSize="sm"
        textAlign="center"
        outline="1px solid"
        outlineColor="gray.300"
      >
        <GridItem key="교시" borderColor="gray.300" bg="gray.100">
          <Flex justifyContent="center" alignItems="center" h="full" w="full">
            <Text fontWeight="bold">교시</Text>
          </Flex>
        </GridItem>
        {DAY_LABELS.map((day) => (
          <GridItem key={day} borderLeft="1px" borderColor="gray.300" bg="gray.100">
            <Flex justifyContent="center" alignItems="center" h="full">
              <Text fontWeight="bold">{day}</Text>
            </Flex>
          </GridItem>
        ))}
        {TIMES.map((time, timeIndex) => (
          <Fragment key={`시간-${timeIndex + 1}`}>
            <GridItem
              borderTop="1px solid"
              borderColor="gray.300"
              bg={timeIndex > 17 ? "gray.200" : "gray.100"}
            >
              <Flex justifyContent="center" alignItems="center" h="full">
                <Text fontSize="xs">
                  {fill2(timeIndex + 1)} ({time})
                </Text>
              </Flex>
            </GridItem>
            {DAY_LABELS.map((day) => (
              <GridItem
                key={`${day}-${timeIndex + 2}`}
                borderWidth="1px 0 0 1px"
                borderColor="gray.300"
                bg={timeIndex > 17 ? "gray.100" : "white"}
                cursor="pointer"
                _hover={{ bg: "yellow.100" }}
                onClick={() => handleTimeClick({ day, time: timeIndex + 1 })}
              />
            ))}
          </Fragment>
        ))}
      </Grid>

      {schedules.map((schedule, index) => (
        <DraggableSchedule
          key={`${schedule.lecture.title}-${index}`}
          id={`${tableId}:${index}`}
          data={schedule}
          bg={getColor(schedule.lecture.id)}
          onDeleteButtonClick={() =>
            handleDeleteButtonClick({
              day: schedule.day,
              time: schedule.range[0],
            })
          }
        />
      ))}
    </Box>
  )
})

export default ScheduleTable
