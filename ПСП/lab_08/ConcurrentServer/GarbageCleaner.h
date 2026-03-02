#pragma once
#include "Global.h"
#include <WS2tcpip.h>

DWORD WINAPI GarbageCleaner(LPVOID pPrm)
{
    cout << "GarbageCleaner started;\n" << endl;
    DWORD rc = 0;

    try
    {
        volatile TalkersCmd* cmd = (volatile TalkersCmd*)pPrm;

        int iteration = 0;

        while (true)
        {
            iteration++;


            // ПЕРВОЕ: проверяем команду Exit
            if (*cmd == Exit)
            {
                cout << "GarbageCleaner: Exit command detected! Starting emergency cleanup..." << endl;

                // Принудительно очищаем всех клиентов при Exit
                EnterCriticalSection(&scListContact);

                int clientCount = 0;

                // Закрываем все сокеты
                for (auto& client : Contacts)
                {
                    clientCount++;

                    // Закрываем сокет
                    if (client.s != INVALID_SOCKET)
                    {
                        cout << "Closing socket for client: "
                            << inet_ntoa(client.prms.sin_addr) << endl;
                        closesocket(client.s);
                        client.s = INVALID_SOCKET;
                    }

                    // Отменяем и закрываем таймер
                    if (client.htimer != NULL)
                    {
                        CancelWaitableTimer(client.htimer);
                        CloseHandle(client.htimer);
                        client.htimer = NULL;
                    }

                    // Закрываем хэндл потока (не ждем завершения)
                    if (client.hthread != NULL)
                    {
                        CloseHandle(client.hthread);
                        client.hthread = NULL;
                    }

                    // Обновляем статистику
                    if (client.sthread == Contact::FINISH)
                        InterlockedIncrement(&Finished);
                    else
                        InterlockedIncrement(&Fail);
                }

                // Очищаем список
                Contacts.clear();
                Work = 0;  // Сбрасываем счетчик

                LeaveCriticalSection(&scListContact);

                cout << "GarbageCleaner: Emergency cleanup completed! Removed "
                    << clientCount << " clients." << endl;
                break;  // Выходим из цикла
            }

            // ВТОРОЕ: обычная очистка завершенных клиентов
            EnterCriticalSection(&scListContact);

            int deletedCount = 0;

            for (auto it = Contacts.begin(); it != Contacts.end(); )
            {
                bool shouldDelete = false;
                Contact& client = *it;

                // Проверяем завершенные клиенты
                if (client.sthread == Contact::FINISH ||
                    client.sthread == Contact::TIMEOUT ||
                    client.sthread == Contact::ABORT ||
                    client.type == Contact::EMPTY)
                {
                    shouldDelete = true;
                }
                // Проверяем "мертвые" сокеты
                else if (client.type == Contact::CONTACT || client.type == Contact::ACCEPT)
                {
                    if (client.s != INVALID_SOCKET)
                    {
                        // Неблокирующая проверка соединения
                        u_long mode = 1;
                        ioctlsocket(client.s, FIONBIO, &mode);

                        char testBuf[1];
                        int testResult = recv(client.s, testBuf, sizeof(testBuf), MSG_PEEK);
                        int error = WSAGetLastError();

                        mode = 0;
                        ioctlsocket(client.s, FIONBIO, &mode);

                        if (testResult == 0)  // Соединение закрыто клиентом
                        {
                            client.sthread = Contact::ABORT;
                            shouldDelete = true;
                            cout << "Client disconnected: "
                                << inet_ntoa(client.prms.sin_addr) << endl;
                        }
                        else if (testResult == SOCKET_ERROR &&
                            (error == WSAECONNRESET || error == WSAECONNABORTED))
                        {
                            client.sthread = Contact::ABORT;
                            shouldDelete = true;
                            cout << "Connection reset: "
                                << inet_ntoa(client.prms.sin_addr) << endl;
                        }
                    }
                }

                if (shouldDelete)
                {
                    deletedCount++;

                    cout << "Deleting client: " << inet_ntoa(client.prms.sin_addr)
                        << " (status: " << client.sthread << ")" << endl;

                    // Обновляем статистику
                    if (client.type == Contact::EMPTY)
                        InterlockedIncrement(&Fail);
                    else
                    {
                        if (client.sthread == Contact::FINISH)
                            InterlockedIncrement(&Finished);
                        else if (client.sthread == Contact::TIMEOUT ||
                            client.sthread == Contact::ABORT)
                            InterlockedIncrement(&Fail);
                    }

                    // Закрываем сокет
                    if (client.s != INVALID_SOCKET)
                    {
                        closesocket(client.s);
                        client.s = INVALID_SOCKET;
                    }

                    // Закрываем таймер
                    if (client.htimer != NULL)
                    {
                        CancelWaitableTimer(client.htimer);
                        CloseHandle(client.htimer);
                        client.htimer = NULL;
                    }

                    // Закрываем хэндл потока (с ожиданием)
                    if (client.hthread != NULL)
                    {
                        // Ждем максимум 500 мс
                        WaitForSingleObject(client.hthread, 500);
                        CloseHandle(client.hthread);
                        client.hthread = NULL;
                    }

                    // Удаляем из списка
                    it = Contacts.erase(it);
                    InterlockedDecrement(&Work);
                }
                else
                {
                    ++it;
                }
            }

            LeaveCriticalSection(&scListContact);

            if (deletedCount > 0)
            {
                cout << "GarbageCleaner: Deleted " << deletedCount
                    << " clients. Remaining: " << Contacts.size() << endl;
            }

            Sleep(500);  // Проверяем каждые 500 мс
        }
    }
    catch (string errorMsgText)
    {
        std::cout << "GarbageCleaner error: " << errorMsgText << endl;
    }

    cout << "GarbageCleaner stopped;\n" << endl;
    ExitThread(rc);
}