import '@testing-library/jest-dom'

// jsdom does not implement URL.createObjectURL / revokeObjectURL
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = () => 'blob:mock'
}
if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = () => {}
}
