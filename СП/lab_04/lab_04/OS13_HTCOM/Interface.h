#pragma once

#include "../../../lab_01/OS10_HTAPI/pch.h"
#include "../../../lab_01/OS10_HTAPI/HT.h"


static const GUID IID_IHT =
{ 0x2bea1fda, 0x811f, 0x4e3b, {0xa2, 0xf9, 0x7, 0x86, 0x5b, 0x6a, 0xa2, 0x28 } };

interface IHT : IUnknown {
    STDMETHOD(create(ht::HtHandle** htHandle, int capacity, int secSnapshotInterval, int maxKeyLength, int maxPayloadLength, const wchar_t* fileName)) PURE;
    STDMETHOD(open(ht::HtHandle** htHandle, const wchar_t* fileName, bool isMapFile = false)) PURE;
    STDMETHOD(snap(BOOL& rc, ht::HtHandle* htHandle)) PURE;
    STDMETHOD(close(BOOL& rc, ht::HtHandle* htHandle)) PURE;
    STDMETHOD(insert(BOOL& rc, ht::HtHandle* htHandle, const ht::Element* element)) PURE;
    STDMETHOD(removeOne(BOOL& rc, ht::HtHandle* htHandle, const ht::Element* element)) PURE;
    STDMETHOD(get(ht::Element** rcElement, ht::HtHandle* htHandle, const ht::Element* element)) PURE;
    STDMETHOD(update(BOOL& rc, ht::HtHandle* htHandle, const ht::Element* oldElement, const void* newPayload, int newPayloadLength)) PURE;
    STDMETHOD(getLastError(const char** lastError, ht::HtHandle* htHandle)) PURE;
    STDMETHOD(print(const ht::Element* element)) PURE;
};


// {216662EB-914C-481B-B91C-AE46BC49F2D3}
static const GUID IID_IElement = 
{ 0x216662eb, 0x914c, 0x481b, {0xb9, 0x1c, 0xae, 0x46, 0xbc, 0x49, 0xf2, 0xd3 } };


interface IElement : IUnknown {
    STDMETHOD(createGetElement(ht::Element** getElement, const void* key, int keyLength)) PURE;
    STDMETHOD(createInsertElement(ht::Element** newElement, const void* key, int keyLength, const void* payload, int  payloadLength)) PURE;
    STDMETHOD(createUpdateElement(ht::Element** updateElement, const ht::Element* oldElement, const void* newPayload, int  newPayloadLength)) PURE;
};