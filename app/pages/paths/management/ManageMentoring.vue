<script>
import { format } from 'date-fns'
import timestamp from 'unix-timestamp'
import ContentWrapper from '@/components/ContentWrapper.vue'
import days from '@/src/util/days'
import setTime from '@/src/util/time'
import { mentoringManager } from '@/src/api/mentoring'

export default {
  name: 'ManageMentoring',
  components: { ContentWrapper },

  filters: {
    filterDay: time => format(time, 'YYYY/MM/DD'),
    filterTime: time => format(time, 'HH:mm'),
    filterDate: time => format(time, 'YYYY/MM/DD HH:mm')
  },

  data () {
    return {
      pending: true,
      tab: 0,
      checks: [],
      selectAll: false,
      filter: {
        day: 0,
        grade: 0
      },
      notice: {},

      modal: {
        create: false,
        edit: false,
        excel: false,
        notice: false,
        black: false,
        expand: {
          grade: false,
          time: false,
          applyTime: false
        }
      },

      form: {
        idx: 0,
        teacher: '',
        day: 0,
        date: new Date(),
        subject: '',
        room: '',
        grade: 0,
        maxUser: 0,
        startTime: new Date(),
        endTime: new Date()
      },

      mentorings: [
        [], [], []
      ],
      blacks: []
    }
  },

  computed: {
    days () {
      return days
    },

    mentoringFullList () {
      return [].concat.apply([], Object.values(this.mentorings))
    },

    filteredList () {
      if (this.tab === 3) {
        if (this.filter.grade === 0) return this.mentoringFullList
        return this.mentorings[this.filter.grade - 1]
      }
      if (this.filter.day === 0) return this.mentorings[this.tab]

      return this.mentorings[this.tab].filter(v => v.day ===
        this.days[this.filter.day - 1].code)
    },

    currentCount () {
      if (this.tab === 3) {
        return this.mentoringFullList.map((mentor) =>
          mentor.mentoringRequest.length).reduce((a, b) => a + b, 0)
      }
      return this.mentorings[this.tab].length
    }
  },

  watch: {
    selectAll (val) {
      this.checks = this.checks.map(() => val)
    },

    filteredList (val) {
      this.checks = [...Array(val.length)].map(() => false)
      this.selectAll = false
    }
  },

  async created () {
    this.pending = true
    await this.updateAll()
    this.pending = false
  },

  methods: {
    async updateAll () {
      this.mentorings = await Promise.all([...Array(3)].map((_, grade) => mentoringManager.getMentoringByGrade(grade + 1)))
      this.checks = [...Array(this.mentorings[this.tab].length)].map(() => false)
      this.mentorings = Object.assign({}, this.mentorings)
      this.notice = await mentoringManager.getNotice()
      this.blacks = await mentoringManager.getBlacklist()
    },

    closeModal () {
      this.modal.create = false
      this.modal.edit = false
      this.form = {
        teacher: '',
        day: 0,
        date: new Date(),
        subject: '',
        room: '',
        grade: 0,
        maxUser: 0,
        startTime: new Date(),
        endTime: new Date()
      }
    },

    async addMentoring () {
      try {
        await mentoringManager.addMentoring(this.form)
        await this.$swal('추가하였습니다', '', 'success')
        this.closeModal()
        await this.updateAll()
      } catch (err) {
        this.$swal('이런!', err.message, 'error')
      }
    },

    async updateMentoring () {
      try {
        await mentoringManager.editMentoring(this.form)
        await this.$swal('수정되었습니다', '', 'success')
        this.closeModal()
        await this.updateAll()
      } catch (err) {
        this.$swal('이런!', err.message, 'error')
      }
    },

    async deleteChecked () {
      if (!this.checks.filter(v => v).length) return
      const { value: answer } = await this.$swal({
        type: 'warning',
        title: '경고',
        text: '정말 삭제하실 건가요? 이 작업은 되돌릴 수 없습니다.',
        confirmButtonColor: '#d61315',
        cancelButtonColor: '#ababab',
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        showCancelButton: true
      })

      if (!answer) return
      try {
        await Promise.all(Object.keys(this.checks.filter(v => v))
          .map(key => mentoringManager.deleteMentoringByAdmin(this.filteredList[key].idx)))
        await this.$swal('삭제되었습니다', '', 'success')
        await this.updateAll()
      } catch (err) {
        this.$swal('이런!', err.message, 'error')
      }
    },

    editMentoring (item) {
      const time = setTime(new Date())
      this.modal.edit = true
      this.form = {
        idx: item.idx,
        teacher: item.teacher.name,
        day: this.getDayIdxByCode(item.day),
        subject: item.subject,
        room: item.room,
        grade: item.targetGrade - 1,
        maxUser: item.maxUser,
        startTime: time(item.startTime),
        endTime: time(item.endTime)
      }
    },

    async deleteMentoring (idx) {
      const { value: answer } = await this.$swal({
        type: 'warning',
        title: '경고',
        text: '정말 삭제하실 건가요? 이 작업은 되돌릴 수 없습니다.',
        confirmButtonColor: '#d61315',
        cancelButtonColor: '#ababab',
        confirmButtonText: '확인',
        cancelButtonText: '취소',
        showCancelButton: true
      })

      if (!answer) return
      try {
        await mentoringManager.deleteMentoringByAdmin(idx)
        await this.$swal('삭제되었습니다', '', 'success')
        await this.updateAll()
      } catch (err) {
        this.$swal('이런!', err.message, 'error')
      }
    },

    async updateNotice () {
      try {
        await mentoringManager.addNotice(this.notice)
        await this.$swal('추가하였습니다', '', 'success')
        this.closeModal()
        await this.updateAll()
      } catch (err) {
        this.$swal('이런!', err.message, 'error')
      }
    },

    async downloadExcel (grade) {
      try {
        await mentoringManager.downloadExcel(grade)
      } catch (err) {
        this.$swal('이런!', err.message, 'error')
      }
    },

    async downloadPeriodExcel () {
      try {
        const { grade, startTime, endTime } = this.form
        await mentoringManager.downloadPeriodExcel(
          grade + 1,
          parseInt(timestamp.fromDate(startTime)),
          parseInt(timestamp.fromDate(endTime))
        )
        this.modal.excel = false
        this.form.grade = 0
        this.form.startTime = this.form.endTime = new Date()
      } catch (err) {
        this.$swal('이런!', err.message, 'error')
      }
    },

    async addBlackuser (serial) {
      await mentoringManager.addBlackuser(serial, timestamp.fromDate(new Date()))
      await this.updateAll()
      this.form.serial = null
    },

    async deleteBlackuser (idx) {
      await mentoringManager.deleteBlackuser(idx)
      this.$swal('삭제했습니다.', '', 'success')
      this.updateAll()
    },

    getDayTextByIdx (idx) {
      return days.find(v => v.idx === idx).text
    },

    getDayIdxByCode (code) {
      return days.find(v => v.code === code).idx
    },

    getDaySmallText (code) {
      return days.find(v => v.code === code).smallText
    }
  }
}
</script>

<template>
  <content-wrapper class="mng-mentoring">
    <h1 slot="header">
      <span class="mng-mentoring__head">
        <span class="icon-comment" />멘토링 신청 관리
      </span>
      <span
        class="mng-mentoring__create"
        @click="modal.create = true"
      >
        <span class="icon-plus" />추가하기
      </span>
      <span
        class="mng-mentoring__notice"
        @click="modal.notice = true"
      >
        <span class="icon-edit" />공지사항 관리
      </span>
      <span
        class="mng-mentoring__blacklist"
        @click="modal.black = true"
      >
        <span class="icon-alert" />블랙리스트 추가
      </span>
    </h1>
    <dimi-card
      slot="main"
      class="mng-mentoring__main"
    >
      <dimi-tab
        v-model="tab"
        :tabs="['1학년', '2학년', '3학년', '신청자']"
      />
      <div
        v-if="pending"
        class="mentoring__loader"
      >
        <dimi-loader />
      </div>
      <section
        v-else-if="tab < 3"
        class="mng-mentoring__section"
      >
        <h2 class="mng-mentoring__title">
          {{ tab + 1 + '학년' }} 멘토링 신청 관리 ({{ currentCount }}개)
        </h2>

        <nav class="mng-mentoring__toolbar">
          <dimi-checkbox
            v-model="selectAll"
            class="mng-mentoring__tool mng-mentoring__select-all"
          >
            모두 선택
          </dimi-checkbox>

          <span
            class="mng-mentoring__tool mng-mentoring__delete"
            @click="deleteChecked"
          >
            <span class="mng-mentoring__delete-icon icon-delete" /> 선택 삭제
          </span>

          <span
            class="mng-mentoring__tool mng-mentoring__excel"
            @click="downloadExcel(tab + 1)"
          >
            <span class="mng-afsc__excel-icon icon-long-arrow-down" /> 엑셀 다운로드
          </span>

          <dimi-dropdown
            v-model="filter.day"
            :items="['필터 없음', ...days.map(v => v.text)]"
            class="mng-mentoring__tool mng-mentoring__sort"
          />
        </nav>

        <table class="mng-mentoring__list">
          <tbody>
            <tr
              v-for="(item, index) in filteredList"
              :key="index"
              class="mng-mentoring__row"
            >
              <td class="mng-mentoring__cell mng-mentoring__cell--name">
                <dimi-checkbox
                  v-model="checks[index]"
                  class="mng-mentoring__item-check"
                >
                  {{ item.teacher.name }} 선생님
                </dimi-checkbox>
              </td>
              <td class="mng-mentoring__cell">
                {{ item.subject }}
              </td>
              <td class="mng-mentoring__cell">
                {{ getDaySmallText(item.day) }}
              </td>
              <td class="mng-mentoring__cell">
                {{ item.startTime }} ~ {{ item.endTime }}
              </td>
              <td class="mng-mentoring__cell">
                {{ item.room }}
              </td>
              <td
                class="mng-mentoring__cell mng-mentoring__cell--button-edit"
                @click="editMentoring(item)"
              >
                <span class="icon-edit" /> 수정
              </td>
              <td
                class="mng-mentoring__cell mng-mentoring__cell--button-delete"
                @click="deleteMentoring(item.idx)"
              >
                <span class="icon-cross" /> 삭제
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      <section
        v-else
        class="mng-mentoring__section"
      >
        <h2 class="mng-mentoring__title">
          멘토링 신청 현황 ({{ currentCount }}개)
        </h2>

        <nav class="mng-mentoring__toolbar">
          <dimi-dropdown
            v-model="filter.grade"
            :items="['필터 없음', '1학년', '2학년', '3학년']"
            class="mng-mentoring__tool mng-mentoring__sort"
          />
          <span
            class="mng-mentoring__excel"
            @click="modal.excel = true"
          >
            <span class="icon-long-arrow-down" />엑셀 다운로드
          </span>
        </nav>

        <table class="mng-mentoring__list">
          <tbody>
            <template
              v-for="(mentoring, index) in filteredList"
            >
              <tr
                v-for="(item, idx) in mentoring.mentoringRequest"
                :key="`req-${index}-${idx}`"
                class="mng-mentoring__row"
              >
                <td class="mng-mentoring__cell mng-mentoring__cell--name">
                  {{ mentoring.teacher.name }} 선생님
                </td>
                <td class="mng-mentoring__cell">
                  {{ mentoring.subject }}
                </td>
                <td class="mng-mentoring__cell">
                  {{ getDaySmallText(mentoring.day) }}
                </td>
                <td class="mng-mentoring__cell">
                  {{ mentoring.startTime }} ~ {{ mentoring.endTime }}
                </td>
                <td class="mng-mentoring__cell">
                  {{ mentoring.room }}
                </td>
                <td class="mng-mentoring__cell">
                  {{ item.requester.serial }} {{ item.requester.name }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </section>

      <dimi-modal
        :opened="modal.create"
        class="modal__modal"
        @close="modal.create = false"
      >
        <h3 class="modal__title">
          멘토링 추가
        </h3>
        <div class="modal__field">
          <div class="modal__label">선생님 명</div>
          <dimi-input
            v-model.trim="form.teacher"
            class="modal__input"
            placeholder="선생님 명을 기입하세요."
          />
        </div>
        <div class="modal__field">
          <div class="modal__label">장소</div>
          <dimi-input
            v-model.trim="form.room"
            class="modal__input"
            placeholder="장소를 기입하세요."
          />
        </div>
        <div class="modal__field">
          <div class="modal__label">과목</div>
          <dimi-input
            v-model.trim="form.subject"
            class="modal__input"
            placeholder="과목을 기입하세요."
          />
        </div>
        <div class="modal__field">
          <div class="modal__label">학년</div>
          <dimi-dropdown
            v-model="form.grade"
            :items="[1, 2, 3]"
          />
        </div>
        <div class="modal__field">
          <div class="modal__label">최대 인원</div>
          <dimi-input
            v-model.number="form.maxUser"
            class="mng-ing__input"
          />
        </div>
        <div class="modal__field">
          <div @click="modal.expand.time = !modal.expand.time">
            <div class="modal__label">멘토링 시간</div>
            <div
              v-if="!modal.expand.time"
              class="modal__label--right"
            >
              {{ getDayTextByIdx(form.day) }} {{ form.startTime | filterTime }} ~ {{ form.endTime | filterTime }}
            </div>
            <div class="modal__expand">
              <span :class="`icon-arrow-${modal.expand.time ? 'up' : 'down'}`" />
            </div>
          </div>
          <div
            v-if="modal.expand.time"
            class="modal__input"
          >
            <div class="modal__label--small modal__label--day">요일</div>
            <dimi-dropdown
              v-model="form.day"
              :items="days.map(v => v.text)"
              :dropup="true"
            />
            <div class="modal__label--small">시작 시간</div>
            <dimi-time-input v-model="form.startTime" />
            <div class="modal__label--small">종료 시간</div>
            <dimi-time-input v-model="form.endTime" />
          </div>
        </div>
        <span
          class="modal__create"
          @click="addMentoring"
        >
          <dimi-button>추가하기</dimi-button>
        </span>
      </dimi-modal>

      <dimi-modal
        :opened="modal.edit"
        class="modal__modal"
        @close="modal.edit = false"
      >
        <h3 class="modal__title">
          멘토링 수정
        </h3>
        <div class="modal__field">
          <div class="modal__label">선생님 명</div>
          <dimi-input
            v-model.trim="form.teacher"
            class="modal__input"
            placeholder="선생님 명을 기입하세요."
          />
        </div>
        <div class="modal__field">
          <div class="modal__label">장소</div>
          <dimi-input
            v-model.trim="form.room"
            class="modal__input"
            placeholder="장소를 기입하세요."
          />
        </div>
        <div class="modal__field">
          <div class="modal__label">과목</div>
          <dimi-input
            v-model.trim="form.subject"
            class="modal__input"
            placeholder="과목을 기입하세요."
          />
        </div>
        <div class="modal__field">
          <div class="modal__label">학년</div>
          <dimi-dropdown
            v-model="form.grade"
            :items="[1, 2, 3]"
          />
        </div>
        <div class="modal__field">
          <div class="modal__label">최대 인원</div>
          <dimi-input
            v-model.number="form.maxUser"
            class="mng-ing__input"
          />
        </div>
        <div class="modal__field">
          <div @click="modal.expand.time = !modal.expand.time">
            <div class="modal__label">멘토링 시간</div>
            <div
              v-if="!modal.expand.time"
              class="modal__label--right"
            >
              {{ getDayTextByIdx(form.day) }} {{ form.startTime | filterTime }} ~ {{ form.endTime | filterTime }}
            </div>
            <div class="modal__expand">
              <span :class="`icon-arrow-${modal.expand.time ? 'up' : 'down'}`" />
            </div>
          </div>
          <div
            v-if="modal.expand.time"
            class="modal__input"
          >
            <div class="modal__label--small modal__label--day">요일</div>
            <dimi-dropdown
              v-model="form.day"
              :items="days.map(v => v.text)"
              :dropup="true"
              class="dropdown-day"
            />
            <div class="modal__label--small">시작 시간</div>
            <dimi-time-input v-model="form.startTime" />
            <div class="modal__label--small">종료 시간</div>
            <dimi-time-input v-model="form.endTime" />
          </div>
        </div>
        <span
          class="modal__create"
          @click="updateMentoring"
        >
          <dimi-button>수정하기</dimi-button>
        </span>
      </dimi-modal>

      <dimi-modal
        :opened="modal.notice"
        class="modal__modal"
        @close="modal.notice = false"
      >
        <h3 class="modal__title">
          공지사항 관리
        </h3>
        <div class="modal__field">
          <div class="modal__label">공지사항</div>
          <dimi-long-input
            v-model.trim="notice.description"
            :height="300"
            class="modal__input"
            placeholder="공지사항을 입력하세요."
          />
        </div>
        <span
          class="modal__create"
          @click="updateNotice"
        >
          <dimi-button>수정하기</dimi-button>
        </span>
      </dimi-modal>

      <dimi-modal
        :opened="modal.black"
        class="modal__modal"
        @close="modal.black = false"
      >
        <h3 class="modal__title">
          블랙리스트 관리
        </h3>
        <div class="modal__label">블랙리스트 목록</div>
        <table
          v-if="blacks.length"
          class="mng-mentoring__list"
        >
          <tbody>
            <tr
              v-for="(user, index) in blacks"
              :key="index"
              class="mng-mentoring__row"
            >
              <td class="mng-mentoring__cell mng-mentoring__cell--name">
                {{ `${user.serial} ${user.name}` }}
              </td>
              <td
                class="mng-mentoring__cell mng-mentoring__cell--button-delete"
                @click="deleteBlackuser(user.userIdx)"
              >
                <span class="icon-cross" /> 삭제
              </td>
            </tr>
          </tbody>
        </table>
        <td
          v-else
          class="mng-mentoring__empty"
        >
          아직 블랙리스트에 추가된 학생이 없습니다.
        </td>
        <div class="modal__field">
          <div class="modal__label">블랙리스트 추가</div>
          <dimi-input
            v-model.number="form.serial"
            class="modal__input"
            placeholder="해당 학생 학번"
          />
        </div>
        <span
          class="modal__create"
          @click="addBlackuser(form.serial)"
        >
          <dimi-button>추가하기</dimi-button>
        </span>
      </dimi-modal>

      <dimi-modal
        :opened="modal.excel"
        class="modal__excel"
        @close="modal.excel = false"
      >
        <h3 class="modal__title">
          멘토링 신청자 엑셀 다운로드
        </h3>
        <div class="modal__field">
          <div class="modal__label">학년</div>
          <dimi-dropdown
            v-model="form.grade"
            :items="[1, 2, 3]"
          />
        </div>
        <div class="modal__field">
          <div class="modal__label">조회할 기간</div>
          <div class="modal__input">
            <div class="modal__label--small">시작 시간</div>
            <dimi-date-input v-model="form.startTime" />
            <div class="modal__label--small">종료 시간</div>
            <dimi-date-input v-model="form.endTime" />
          </div>
        </div>
        <span
          class="modal__create"
          @click="downloadPeriodExcel()"
        >
          <dimi-button>다운로드</dimi-button>
        </span>
      </dimi-modal>
    </dimi-card>
  </content-wrapper>
</template>

<style lang="scss" scoped>
.mentoring {
  padding: 0;
  border: 0;

  &__loader {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.content {
  @include until($tablet) {
    &__header > h1 {
      margin-bottom: 1.8em;
    }
  }
}

.mng-mentoring {
  &__main {
    padding: 0;
  }

  &__section {
    padding: 0 24px 24px;
    margin-top: 36px;
  }

  &__section:last-child {
    padding-bottom: 0;
  }

  &__head {
    @include until($tablet) {
      display: block;
    }
  }

  &__notice,
  &__blacklist {
    margin-top: 1em;
    margin-right: 0.5em;
    color: $orange;
    cursor: pointer;
    float: right;
    font-size: 16px;
  }

  &__create {
    margin-top: 1em;
    margin-right: 0.5em;
    color: $red;
    cursor: pointer;
    float: right;
    font-size: 16px;
  }

  &__title {
    margin-bottom: 32px;
    color: $gray-dark;
    font-size: 24px;
    font-weight: $font-weight-bold;
  }

  &__toolbar {
    display: flex;
    margin-bottom: 12px;
    color: $gray-light;
    font-size: 16px;
    font-weight: $font-weight-bold;
    @include until($tablet) {
      flex-wrap: wrap;
      justify-content: space-between;
    }
  }

  &__tool:not(:first-child) {
    margin-left: 2em;
  }

  &__tool {
    @include until($tablet) {
      display: inline-block;
      width: 40%;
      justify-content: flex-start;
      margin-left: unset !important;
      text-align: left;
    }
  }

  &__select-all {
    user-select: none;
  }

  &__delete,
  &__excel {
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
  }

  &__delete-icon {
    font-size: 18px;
  }

  &__list {
    display: block;
    width: 100%;
    color: $gray !important;
    font-weight: $font-weight-bold;
    overflow-y: auto;
  }

  &__row:not(:last-child) {
    border-bottom: 1px solid $gray-lighter;
  }

  &__cell {
    padding: 24px 0;
    color: $gray;
    white-space: nowrap;
  }

  &__cell--name {
    color: $gray-dark;

    @include from($tablet) {
      width: 99%;
    }
  }

  &__cell:not(:last-child) {
    padding-right: 1.5em;
  }

  &__cell--button-edit {
    padding-right: 24px;
    color: $red;
    cursor: pointer;
  }

  &__cell--button-delete {
    color: $gray-light;
    cursor: pointer;
  }

  &__field {
    display: flex;
    align-items: center;
  }

  &__label {
    width: 5em;
    max-width: 4em;
    padding-right: 1em;
  }

  &__input {
    font-size: 16px;
  }

  &__empty {
    padding: 24px 0;
    margin-right: 16px;
    color: $gray;
    font-size: 16px;
    font-weight: $font-weight-bold;
  }
}

.modal {
  &__title {
    margin-bottom: 1.5em;
    color: $gray-dark;
    font-size: 24px;
    font-weight: $font-weight-bold;
  }

  &__field {
    margin: 1.5rem 0;
  }

  &__field:last-of-type {
    margin-bottom: 3em;
  }

  &__label {
    display: inline-block;
    margin-bottom: 8px;
    color: $gray-dark;
    font-size: 20px;
    font-weight: $font-weight-bold;
    line-height: 1.15;
  }

  &__label--small {
    margin-top: 5px;
    margin-bottom: 8px;
    color: $gray;
    font-size: 18px;
    font-weight: $font-weight-bold;
    line-height: 1.15;
  }

  &__label--minimal {
    display: inline-block;
    margin-right: 0.5em;
    color: $black;
    font-size: 16px;
    line-height: 1.15;
  }

  &__label--right {
    display: block;
    margin-right: 20px;
    float: right;
    font-size: 16px;
  }

  &__expand {
    display: inline-block;
    margin-bottom: 16px;
    margin-left: 8px;
    cursor: pointer;
  }

  &__checkbox {
    margin-bottom: 13px;
  }

  &__create {
    position: absolute;
    right: 25px;
    bottom: 1.5em;
    margin-right: 0.5em;
    color: $red;
    cursor: pointer;
    font-size: 16px;
    font-weight: $font-weight-bold;
  }

  .dropdown {
    font-size: 20px;
  }

  &__label--day {
    display: inline-block;
    font-size: 20px;
  }
}

.dropdown {
  display: inline-flex;
  margin-left: 0.5em;
  line-height: 1.15;

  &__item {
    padding: 15px 24px;
    background-color: $white;
    text-align: center;
  }

  &__item:hover {
    background-color: $gray-lighten;
  }
}

.date-input {
  margin-bottom: 1em;
}
</style>
