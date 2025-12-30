/**
 * Unit Test cho hàm generateId
 * 
 * Unit Test là gì?
 * - Test từng hàm/function riêng lẻ
 * - Đảm bảo hàm hoạt động đúng với nhiều trường hợp khác nhau
 * - Chạy nhanh, không cần database hay server
 */

const { generateId } = require('../../src/utils/generateId');

// describe = Nhóm các test liên quan lại với nhau
describe('generateId', () => {
  
  // test() hoặc it() = Một test case cụ thể
  test('should generate an ID with correct prefix', () => {
    const id = generateId('U', 10);
    
    // expect() = Kiểm tra kết quả
    // toBe() = Phải bằng chính xác
    expect(id.startsWith('U')).toBe(true);
  });

  test('should generate an ID with correct length', () => {
    const id = generateId('C', 10);
    
    expect(id.length).toBe(10);
  });

  test('should generate uppercase ID', () => {
    const id = generateId('B', 10);
    
    // toMatch() = Khớp với regex
    expect(id).toMatch(/^[A-Z0-9]+$/);
  });

  test('should generate different IDs each time', () => {
    const id1 = generateId('U', 10);
    const id2 = generateId('U', 10);
    
    // not.toBe() = Không được bằng
    expect(id1).not.toBe(id2);
  });

  test('should work with different prefixes', () => {
    const userId = generateId('U', 10);
    const courtId = generateId('C', 10);
    const bookingId = generateId('B', 10);

    expect(userId.startsWith('U')).toBe(true);
    expect(courtId.startsWith('C')).toBe(true);
    expect(bookingId.startsWith('B')).toBe(true);
  });

});
