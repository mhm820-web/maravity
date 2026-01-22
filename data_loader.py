# -*- coding: utf-8 -*-
"""
데이터 로더 모듈
Excel 파일에서 단어장 데이터를 로드합니다.
범위 선택 지원 (시작번호~끝번호)
"""

import pandas as pd
import os

EXCEL_FILE_PATH = 'data/단어장 레벨.xlsx'

# 레벨 이름 매핑 (시트명 -> 표시 이름)
# 난이도 순서: Phonics → Pre Let's → Ready To Talk → Let's Talk → Ready to Speak 
#            → Let's Speak → Let's Express → Kopi Wang → Pre Junior → Junior Plus 
#            → Senior Plus → Master → M.E.C → Bridge
LEVEL_NAMES = {
    'BRIDGE_단어장': 'Bridge',
    'JP_단어장': 'Junior Plus',
    'PJ_단어장': 'Pre Junior',
    'KWLE_단어장': 'Kopi Wang / Let\'s Express',
    'LS_단어장': 'Let\'s Speak',
    'LT_단어장': 'Let\'s Talk'
}

# 레벨 순서 (쉬운 것부터 어려운 순)
LEVEL_ORDER = [
    'LT_단어장',      # Let's Talk (초급)
    'LS_단어장',      # Let's Speak (초중급)
    'KWLE_단어장',    # Kopi Wang / Let's Express (중급)
    'PJ_단어장',      # Pre Junior (중상급)
    'JP_단어장',      # Junior Plus (상급)
    'BRIDGE_단어장',  # Bridge (최상급)
]


def load_vocabulary_data():
    """
    Excel 파일에서 모든 레벨의 단어 데이터를 로드합니다.
    
    Returns:
        dict: {레벨명: [{'no': 번호, 'word': 영단어, 'meaning': 뜻}, ...]}
    """
    if not os.path.exists(EXCEL_FILE_PATH):
        raise FileNotFoundError(f"파일을 찾을 수 없습니다: {EXCEL_FILE_PATH}")
    
    xls = pd.ExcelFile(EXCEL_FILE_PATH)
    vocabulary_data = {}
    
    for sheet_name in xls.sheet_names:
        df = pd.read_excel(EXCEL_FILE_PATH, sheet_name=sheet_name)
        
        # 필요한 컬럼만 추출 (No., 단어, 뜻)
        df_clean = df[['No.', '단어', '뜻']].copy()
        df_clean.columns = ['no', 'word', 'meaning']
        
        # NaN 값 제거
        df_clean = df_clean.dropna()
        
        # 딕셔너리 리스트로 변환
        words_list = df_clean.to_dict('records')
        
        vocabulary_data[sheet_name] = words_list
    
    return vocabulary_data


def get_level_list():
    """
    사용 가능한 레벨 목록을 반환합니다.
    난이도 순서대로 정렬됩니다.
    
    Returns:
        list: [{'id': 시트명, 'name': 표시명, 'count': 단어수}, ...]
    """
    data = load_vocabulary_data()
    levels = []
    
    # 레벨 순서대로 정렬
    for level_id in LEVEL_ORDER:
        if level_id in data:
            levels.append({
                'id': level_id,
                'name': LEVEL_NAMES.get(level_id, level_id),
                'count': len(data[level_id])
            })
    
    # 순서에 없는 레벨도 추가
    for sheet_name, words in data.items():
        if sheet_name not in LEVEL_ORDER:
            levels.append({
                'id': sheet_name,
                'name': LEVEL_NAMES.get(sheet_name, sheet_name),
                'count': len(words)
            })
    
    return levels


def get_words_by_level(level_id, start=1, end=1000):
    """
    특정 레벨에서 지정된 범위의 단어를 반환합니다.
    
    Args:
        level_id (str): 레벨 ID (시트명)
        start (int): 시작 번호 (1부터 시작)
        end (int): 끝 번호
    
    Returns:
        list: 지정된 범위의 단어 리스트
    """
    data = load_vocabulary_data()
    
    if level_id not in data:
        raise ValueError(f"존재하지 않는 레벨입니다: {level_id}")
    
    words = data[level_id]
    
    # 범위 검증
    if start < 1:
        start = 1
    if end > len(words):
        end = len(words)
    if start > end:
        start = end
    
    # 인덱스 변환 (1-based to 0-based)
    start_idx = start - 1
    end_idx = end
    
    # 범위 내의 단어만 반환
    selected = words[start_idx:end_idx]
    
    return selected


if __name__ == '__main__':
    # 테스트
    print("=== 레벨 목록 (난이도 순) ===")
    levels = get_level_list()
    for level in levels:
        print(f"  {level['name']}: {level['count']}개 단어")
    
    print("\n=== Let's Talk 레벨 1~10번 단어 ===")
    sample = get_words_by_level('LT_단어장', 1, 10)
    for i, word in enumerate(sample, 1):
        print(f"  {i}. {word['word']} - {word['meaning']}")
